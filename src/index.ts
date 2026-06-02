import { createWriteStream } from "fs";
import { resolve, join, relative } from "path";
import { run } from "./utils/process/run";
import { readGitmodules, Submodule } from "./utils/git/read-gitmodules";
import { removeSubmodule } from "./operations/main-repo/removeSubmodule";
import { pullSubmoduleToMainRepo } from "./operations/main-repo/pullSubmoduleToMainRepo";
import { applyTransformationForSubmodule } from "./operations/submodule/worker/applyTransformationForSubmodule";
import { whileIndexLock } from "./utils/git/while-index-lock";
import { ensureSameCaseForPath } from "./utils/path/ensure-same-case-for-path";
import { checkoutBranches } from "./transformation/checkout-branches/checkoutBranches";
import { createTreeFile } from "./transformation/create-tree-file";
import { mkdir } from "fs/promises";
import { execFileSync } from "child_process";
import { createTempDir } from "./utils/storage/create-temp-dir";
import { performUnpackAllArchives } from "./operations/main-repo/04-unpack-archives/performUnpackAllArchives";

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
    /** Keep all untracked files after transformation */
    keepUntrackedFiles?: boolean;
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
        keepUntrackedFiles,
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

    console.log("from-submodules-to-monorepo");
    if ("__VERSION__" in globalThis)
        console.log("   version: " + globalThis.__VERSION__);
    console.log("");
    console.log("Going to perform transformation:");
    console.log(`   Directory: ${process.cwd()}`);
    console.log(`   Repo dir: ${relative(process.cwd(), mainRepoDir)}`);
    let keepUntrackedFilesPath: string | undefined = undefined;
    if (keepUntrackedFiles) {
        keepUntrackedFilesPath = createTempDir();
        console.log(
            `   Keeping untracked files. Stores archives in ${keepUntrackedFilesPath}`,
        );
    }
    if (dirForTreeFiles != null) {
        console.log("Tree files: " + dirForTreeFiles);
        treeBeforePath = await createTreeFile(
            mainRepoDir,
            "tree-before.json",
            dirForTreeFiles,
        );
    }
    if (resetWithMasterOrMainBranches) {
        console.log("");
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
            console.log("   " + line.replaceAll("\n", "\n   "));
        }
    }
    console.log("");
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
            console.log(``);
            console.log(`Deleted existing branch ${migrationBranchName}`);
        } catch {
            // nothing
        }
    }

    console.log(``);
    console.log(`Checking out branch ${migrationBranchName}`);
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

    console.log(``);
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
        console.log("   Queued " + relative(mainRepoDir, fullPath));
        const workerThread = applyTransformationForSubmodule(
            mainRepoDir,
            migrationBranchName,
            fullPath,
            submodule,
            submodules,
            deleteExistingBranches ?? false,
            keepUntrackedFilesPath,
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
                    `   Workers left: ${workersLeft} / ${totalWorkers}` +
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

    if (keepUntrackedFilesPath != null) {
        console.log("Unpacking all archives in " + keepUntrackedFilesPath);
        const lines = await performUnpackAllArchives(
            keepUntrackedFilesPath,
            mainRepoDir,
        );
        for (const line of lines) {
            console.log("   " + line.replaceAll("\n", "\n   "));
        }
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
