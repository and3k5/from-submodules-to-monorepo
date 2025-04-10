#!/usr/bin/env node
const { existsSync } = require("fs");
const { resolve, join, relative, parse } = require("path");
const { run } = require("./utils/process/run");
const { readGitmodules } = require("./utils/git/read-gitmodules");
const { cwd } = require("process");
const { pullFlag } = require("./utils/args/pull-flag");
const { pullValue } = require("./utils/args/pull-value");
const {
    removeSubmodule,
} = require("./operations/main-repo/01-remove-submodule");
const {
    pullSubmoduleToMainRepo,
} = require("./operations/main-repo/02-pull-submodule-to-main-repo");
const {
    applyTransformationForSubmodule,
} = require("./operations/submodule/worker-thread-1");
const { whileIndexLock } = require("./utils/git/while-index-lock");
const {
    ensureSameCaseForPath,
} = require("./utils/path/ensure-same-case-for-path");
const { checkoutBranches } = require("./transformation/checkout-branches");
const { runExec } = require("./utils/process/run-exec");

/**
 *
 * @param {string} mainRepoDir
 * @param {object} options
 * @param {string} options.migrationBranchName Branch name to create for the migration
 * @param {boolean?} options.resumeFromExistingBranch Resume in branch that already exists instead of creating new branch
 * @param {boolean?} options.resetWithMasterOrMainBranches Reset branches checkout, cleanup and such
 */
async function performTransformation(
    mainRepoDir,
    {
        migrationBranchName,
        resumeFromExistingBranch,
        resetWithMasterOrMainBranches,
        deleteExistingBranches,
    },
) {
    if (typeof mainRepoDir != "string")
        throw new Error("A repo directory is required");
    if (mainRepoDir == "") throw new Error("Must have valid path");
    if (typeof migrationBranchName != "string")
        throw new Error("Migration branch name is required");
    if (migrationBranchName == "")
        throw new Error("Must have valid branch name");

    console.log("Going to transform directory:");
    console.log(`   ${mainRepoDir}`);
    if (resetWithMasterOrMainBranches) {
        console.log("Resetting repos first");
        const lines = await checkoutBranches(
            mainRepoDir,
            ["main", "master"],
            {
                noSubmoduleUpdate: false,
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
            runExec("git", ["branch", "-D", migrationBranchName], {
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

    /**
     * @type {Array<Promise<{submodule: import("./utils/git/read-gitmodules").Submodule, logOutput: string[], error: any, success: boolean}>>}
     */
    const workers = [];

    const totalWorkers = submodules.length;
    let workersLeft = totalWorkers;
    let failed = 0;

    for (const submodule of submodules) {
        const fullPath = ensureSameCaseForPath(
            resolve(mainRepoDir, submodule.path),
        );
        console.log("Queued " + relative(mainRepoDir, fullPath));
        workers.push(
            applyTransformationForSubmodule(
                mainRepoDir,
                migrationBranchName,
                fullPath,
                submodule,
                submodules,
                deleteExistingBranches,
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
                }),
        );
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
            resolve(mainRepoDir, submodule.path),
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

    console.log("Transformation finished!");
}

function getCommandLine() {
    const nodeName = process.argv0;
    const relPath = relative(cwd(), process.argv[1]);
    if (parse(relPath).dir.replace(/\\/g, "/").split("/").length > 2) {
        return "npx from-submodules-to-monorepo";
    }
    return `${nodeName} ${relPath}`;
}

function showUsage() {
    console.log("Usage:");
    console.log(
        `${getCommandLine()} <repo-dir> <branch-name> --acknowledge-risks-and-continue`,
    );
}

if (module.id == ".") {
    const argsLeftOver = process.argv.slice(2);
    const acknowledged = pullFlag(
        argsLeftOver,
        "--acknowledge-risks-and-continue",
    );
    const resumeFromExistingBranch = pullFlag(
        argsLeftOver,
        "--resume-from-existing-branch",
    );
    const resetWithMasterOrMainBranches = pullFlag(
        argsLeftOver,
        "--reset-with-master-or-main-branches",
    );
    const deleteExistingBranches = pullFlag(
        argsLeftOver,
        "--delete-existing-branches",
    );
    const mainRepoDir = pullValue(argsLeftOver);

    if (mainRepoDir == null) {
        console.error("Missing repo dir");
        showUsage();
        return;
    }

    if (argsLeftOver.length > 1) {
        console.error("Invalid args");
        showUsage();
        return;
    }

    let migrationBranchName = pullValue(argsLeftOver);

    if (migrationBranchName == null || migrationBranchName == "") {
        migrationBranchName = "from-submodules-to-monorepo";
    }

    if (!existsSync(mainRepoDir)) {
        throw new Error(`The directory does not exist: ${mainRepoDir}`);
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
        resumeFromExistingBranch,
        resetWithMasterOrMainBranches,
        deleteExistingBranches,
    });
} else {
    module.exports.performTransformation = performTransformation;
}
