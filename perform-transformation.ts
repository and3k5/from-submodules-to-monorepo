#!/usr/bin/env node
import { existsSync, createWriteStream } from "fs";
import { resolve, join, relative, parse } from "path";
import { run } from "./utils/process/run";
import { readGitmodules, Submodule } from "./utils/git/read-gitmodules";
import { cwd } from "process";
import { removeSubmodule } from "./operations/main-repo/01-remove-submodule";
import { pullSubmoduleToMainRepo } from "./operations/main-repo/02-pull-submodule-to-main-repo";
import { applyTransformationForSubmodule } from "./operations/submodule/worker";
import { whileIndexLock } from "./utils/git/while-index-lock";
import { ensureSameCaseForPath } from "./utils/path/ensure-same-case-for-path";
import { checkoutBranches } from "./transformation/checkout-branches";
import { prettyFormatCommandUsage } from "./utils/args/pretty-format-command-usage";
import { createTreeFile } from "./transformation/create-tree-file";
import { mkdir } from "fs/promises";
import { createConfig, getCommandValues } from "./utils/args/command-config";
import { execFileSync } from "child_process";

interface PerformTransformationOptions {
    /** Branch name to create for the migration */
    migrationBranchName: string;
    /**  Resume in branch that already exists instead of creating new branch */
    resumeFromExistingBranch?: boolean;
    /**  Reset branches checkout, cleanup and such */
    resetWithMasterOrMainBranches?: boolean;
    /**  Delete existing branches */
    deleteExistingBranches?: boolean;
    /**  Don't run in parallel threads */
    noThreads?: boolean;
    /**  Pull remotes for all submodules and main repo */
    pullRemotes?: boolean;
    /**  Safety switch to avoid pulling remotes uncontrollably */
    nukeRemote?: boolean;
    /** Create tree files to compare directory before and after transformation */
    createTreeFiles?: boolean;
    /** Create a report directory with all the information and output from the transformation */
    createReport?: boolean;
}

interface TransformationResult {
    success: true;
    treeBeforePath?: string;
    treeAfterPath?: string;
}

export async function performTransformation(
    mainRepoDir: string,
    {
        migrationBranchName,
        resumeFromExistingBranch,
        resetWithMasterOrMainBranches,
        deleteExistingBranches,
        noThreads,
        pullRemotes,
        nukeRemote,
        createTreeFiles,
        createReport,
    }: PerformTransformationOptions,
): Promise<TransformationResult> {
    if (typeof mainRepoDir != "string")
        throw new Error("A repo directory is required");
    if (mainRepoDir == "") throw new Error("Must have valid path");
    if (typeof migrationBranchName != "string")
        throw new Error("Migration branch name is required");
    if (migrationBranchName == "")
        throw new Error("Must have valid branch name");

    let dirForTreeFiles: string | null = null;

    let dirForReport: string | null = null;

    let treeBeforePath: string | null = null;
    let treeAfterPath: string | null = null;

    process.on("exit", () => {
        const totalMilliseconds = performance.now();
        const seconds = Math.floor(totalMilliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        const readableTime = [
            hours > 0 ? `${hours} hour${hours > 1 ? "s" : ""}` : null,
            minutes % 60 > 0
                ? `${minutes % 60} minute${minutes % 60 > 1 ? "s" : ""}`
                : null,
            seconds % 60 > 0
                ? `${seconds % 60} second${seconds % 60 > 1 ? "s" : ""}`
                : null,
        ]
            .filter(Boolean)
            .join(" and ");

        console.log("Total time elapsed: " + readableTime);
    });

    if (createReport) {
        dirForReport = resolve(
            mainRepoDir,
            "..",
            "report" + new Date().getTime(),
        );
        await mkdir(dirForReport, { recursive: true });
        dirForTreeFiles = dirForReport;
        const outputLogPath = join(dirForReport, "output.log");
        const logStream = createWriteStream(outputLogPath, { flags: "a" });

        const originalStdoutWrite = process.stdout.write.bind(process.stdout);
        const originalStderrWrite = process.stderr.write.bind(process.stderr);
        const originalConsoleError = console.error.bind(console);

        process.stdout.write = (chunk, ...args) => {
            logStream.write(chunk);
            return originalStdoutWrite(chunk, ...args);
        };

        process.stderr.write = (chunk, ...args) => {
            logStream.write(chunk);
            return originalStderrWrite(chunk, ...args);
        };

        console.error = (...args) => {
            const message = args.join(" ") + "\n";
            logStream.write(message);
            originalConsoleError(...args);
        };

        process.on("exit", () => {
            logStream.end();
        });
    } else if (createTreeFiles) {
        dirForTreeFiles = resolve(mainRepoDir, "..");
    }

    console.log("Going to transform directory:");
    console.log(`   ${mainRepoDir}`);
    if (dirForTreeFiles != null) {
        console.log(
            "Creating tree file before transformation to " + dirForTreeFiles,
        );
        treeBeforePath = await createTreeFile(
            mainRepoDir,
            "tree-before.json",
            dirForTreeFiles,
        );
    }
    if (resetWithMasterOrMainBranches) {
        console.log("Resetting repos first");
        const lines = await checkoutBranches(
            mainRepoDir,
            ["main", "master"],
            {
                noSubmoduleUpdate: false,
                noThreads: noThreads,
                pullRemotes: pullRemotes,
                nukeRemote: nukeRemote,
            },
            console,
        );
        for (const line of lines) {
            console.log(line);
        }
    }
    console.log(
        (resumeFromExistingBranch ? "Resuming from" : "Creating new") +
            " migration branch:",
    );
    console.log(`   ${migrationBranchName}`);

    if (deleteExistingBranches) {
        try {
            execFileSync("git", ["branch", "-D", migrationBranchName], {
                cwd: mainRepoDir,
                stdio: "ignore",
            });
        } catch {
            // nothing
        }
    }

    run(
        "git",
        [
            "checkout",
            ...(resumeFromExistingBranch ? [] : ["-b"]),
            migrationBranchName,
        ],
        { cwd: mainRepoDir },
    );

    const submodules = readGitmodules(join(mainRepoDir, ".gitmodules"));

    console.log("Performing transformation:");

    const workers: Promise<{
        submodule: Submodule;
        logOutput: string[];
        error: unknown;
        success: boolean;
    }>[] = [];

    const totalWorkers = submodules.length;
    let workersLeft = totalWorkers;
    let failed = 0;

    for (const submodule of submodules) {
        if (!("path" in submodule) || submodule.path == null) {
            throw new Error("Error: Submodule has no path");
        }
        const fullPath = ensureSameCaseForPath(
            resolve(mainRepoDir, submodule.path),
        );
        console.log("Queued " + relative(mainRepoDir, fullPath));
        const workerThread = applyTransformationForSubmodule(
            mainRepoDir,
            migrationBranchName,
            fullPath,
            submodule,
            submodules,
            deleteExistingBranches ?? false,
        )
            .then((logOutput) => ({
                submodule,
                logOutput,
                success: true,
                error: null,
            }))
            .catch((err) => {
                failed++;
                return {
                    submodule,
                    logOutput: [],
                    success: false,
                    error: err,
                };
            })
            .finally(() => {
                workersLeft--;
                console.log(
                    `Workers left: ${workersLeft} / ${totalWorkers}` +
                        (failed > 0
                            ? ` \x1b[31m(${failed} failed)\x1b[0m`
                            : ""),
                );
            });
        if (noThreads) {
            await workerThread;
        }
        workers.push(workerThread);
    }

    const workerResults = await Promise.all(workers);

    if (workerResults.some((x) => x.success === false)) {
        for (const data of workerResults.filter((x) => x.success == false)) {
            console.error("Error in submodule " + data.submodule.path);
            console.error(data.error);
        }
        throw new Error("Some workers failed, stopping the process");
    }

    for (const data of workerResults) {
        const { submodule, logOutput } = data;
        const fullPath = ensureSameCaseForPath(
            resolve(mainRepoDir, submodule.path!),
        );
        for (const line of logOutput) {
            console.log(line);
        }
        await whileIndexLock(fullPath);
        await removeSubmodule(mainRepoDir, submodule, console);
        await pullSubmoduleToMainRepo(
            mainRepoDir,
            submodule,
            migrationBranchName,
            console,
        );
    }

    if (dirForTreeFiles != null) {
        console.log(
            "Creating tree file after transformation to " + dirForTreeFiles,
        );
        treeAfterPath = await createTreeFile(
            mainRepoDir,
            "tree-after.json",
            dirForTreeFiles,
        );
    }

    console.log("Transformation finished!");

    const result: TransformationResult = {
        success: true,
    };
    if (treeBeforePath) {
        result.treeBeforePath = treeBeforePath;
    }
    if (treeAfterPath) {
        result.treeAfterPath = treeAfterPath;
    }

    return result;
}

function getCommandLine() {
    const nodeName = process.argv0;
    const relPath = relative(cwd(), process.argv[1]);
    if (parse(relPath).dir.replace(/\\/g, "/").split("/").length > 2) {
        return "npx from-submodules-to-monorepo";
    }
    return `${nodeName} ${relPath}`;
}

const defaultMigrationBranchName = "from-submodules-to-monorepo";
if (require.main?.id === module.id) {
    const argsConfig = createConfig({
        flags: {
            help: {
                identifier: "--help",
                description: "Show this help message.",
            },
            acknowledged: {
                identifier: "--acknowledge-risks-and-continue",
                description: "Acknowledge the risks",
                required: true,
            },
            resetWithMasterOrMainBranches: {
                identifier: "--reset-with-master-or-main-branches",
                description:
                    "Reset the branches to master or main before running transformation.",
            },
            noThreads: {
                identifier: "--no-threads",
                description: "Don't run in parallel threads.",
                requiredRemarks:
                    "Required if --pull-remotes is used without --nuke-remote.",
            },
            pullRemotes: {
                identifier: "--pull-remotes",
                description:
                    "Pull remotes for all submodules and main repo.\nMust be used with either --no-threads or --nuke-remote.",
            },
            nukeRemote: {
                identifier: "--nuke-remote",
                description:
                    "Safety switch to avoid pulling remotes uncontrollably.",
                requiredRemarks:
                    "Required if --pull-remotes is used without --no-threads.",
            },
            deleteExistingBranches: {
                identifier: "--delete-existing-branches",
                description:
                    "If any branch exist (<branch-name>) then delete them.",
            },
            createReport: {
                identifier: "--create-report",
                description:
                    "Create a report with the transformation output and tree files to compare before and after.",
            },
            createTreeFiles: {
                identifier: "--create-tree-files",
                description:
                    "Create tree files to compare before and after.\nOverwritten when using --create-report.",
            },
        },
        values: {
            repoDir: {
                identifier: "repo-dir",
                description: "Path to the main repo directory.",
                required: true,
            },
            branchName: {
                identifier: "branch-name",
                description: "Name of the branch to create for the migration.",
                defaultValue: defaultMigrationBranchName,
            },
        },
    });
    const showUsage = function () {
        console.log(values);
        console.log(prettyFormatCommandUsage(getCommandLine(), argsConfig));
    };

    const argValues = getCommandValues(argsConfig, process.argv.slice(2));
    if (argValues == null) {
        console.error("Invalid args");
        showUsage();
        process.exit(1);
    }
    const flags = argValues.flags;
    const values = argValues.values;
    if (flags.help) {
        showUsage();
        process.exit(0);
    }
    const acknowledged = flags.acknowledged;
    const resetWithMasterOrMainBranches = flags.resetWithMasterOrMainBranches;
    const deleteExistingBranches = flags.deleteExistingBranches;
    const createReport = flags.createReport;
    const createTreeFiles = flags.createTreeFiles;
    const noThreads = flags.noThreads;
    const pullRemotes = flags.pullRemotes;
    const nukeRemote = flags.nukeRemote;
    const mainRepoDir = values.repoDir;

    if (mainRepoDir == null) {
        console.error("Missing repo dir");
        showUsage();
        process.exit(1);
    }

    let migrationBranchName = values.branchName;

    if (migrationBranchName == null || migrationBranchName == "") {
        migrationBranchName = defaultMigrationBranchName;
    }

    if (!existsSync(mainRepoDir)) {
        throw new Error(`The directory does not exist: ${mainRepoDir}`);
    }

    if (pullRemotes) {
        if (!nukeRemote && !noThreads) {
            console.error(
                "--pull-remotes requires --no-threads or --nuke-remote",
            );
            showUsage();
            process.exit(1);
        }
    }

    if (!acknowledged) {
        console.log("You must acknowledge the risks:");
        console.log("Use it at your own risk.");
        console.log(
            "This script is highly experimental and may cause irreversible damage, including but not limited to data loss, corruption of repositories, or deletion of your entire project. I will not be held responsible or liable for any damages, errors, or losses caused by using this solution. Always ensure you have proper backups before proceeding.",
        );
        console.log("Use --acknowledge-risks-and-continue and try again");
        process.exit(1);
    }

    if (typeof mainRepoDir != "string")
        throw new Error("A repo directory is required");
    if (typeof migrationBranchName != "string")
        throw new Error("Migration branch name is required");

    performTransformation(mainRepoDir, {
        migrationBranchName,
        resetWithMasterOrMainBranches,
        deleteExistingBranches,
        noThreads,
        pullRemotes,
        nukeRemote,
        createReport,
        createTreeFiles,
    });
}
