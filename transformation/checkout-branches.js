const { cwd } = require("process");
const { pullFlag } = require("../utils/args/pull-flag");
const { pullValue } = require("../utils/args/pull-value");
const { getMatchingBranch } = require("../utils/git/get-matching-branch");
const { readGitmodules } = require("../utils/git/read-gitmodules");
const { runExec } = require("../utils/process/run-exec");
const { resolve, relative, join } = require("path");
const { existsSync } = require("fs");
const {
    isMainThread,
    workerData,
    parentPort,
    Worker,
} = require("worker_threads");
const { createConsoleWrapper } = require("../utils/output/console-wrapper");
const { whileIndexLock } = require("../utils/git/while-index-lock");
const {
    prettyFormatCommandUsage,
} = require("../utils/args/pretty-format-command-usage");

/**
 *
 * @param {string} path
 * @param {string | string[]} branchNames
 * @param {import("../utils/output/console-wrapper").ConsoleBase} console
 */
async function checkoutBranch(path, branchNames, console) {
    const matchingBranchName = getMatchingBranch(path, branchNames);
    if (matchingBranchName == null)
        throw new Error(
            "Has no matching branch names for any of the branches: " +
                branchNames.join(", "),
        );

    await whileIndexLock(path);
    console.log("Restore: " + path);
    console.log("  Restore staged files");
    runExec("git", ["restore", "--staged", "."], {
        cwd: path,
        stdio: "ignore",
    });
    console.log("  Restore unstaged files");
    runExec("git", ["restore", "."], { cwd: path, stdio: "ignore" });
    console.log("  Delete untracked files");
    runExec("git", ["clean", "-f"], { cwd: path, stdio: "ignore" });
    console.log("  Delete untracked dirs");
    runExec("git", ["clean", "-fd"], { cwd: path, stdio: "ignore" });
    console.log("  Delete untracked + excluded dirs");
    runExec("git", ["clean", "-fdx"], { cwd: path, stdio: "ignore" });
    console.log("  Check out branch: " + matchingBranchName);
    runExec("git", ["checkout", matchingBranchName], {
        cwd: path,
        stdio: "ignore",
    });
    console.log("  Restore staged files");
    runExec("git", ["restore", "--staged", "."], {
        cwd: path,
        stdio: "ignore",
    });
    console.log("  Restore unstaged files");
    runExec("git", ["restore", "."], { cwd: path, stdio: "ignore" });
    console.log("  Delete untracked files");
    runExec("git", ["clean", "-f"], { cwd: path, stdio: "ignore" });
    console.log("  Delete untracked dirs");
    runExec("git", ["clean", "-fd"], { cwd: path, stdio: "ignore" });
    console.log("  Delete untracked + excluded dirs");
    runExec("git", ["clean", "-fdx"], { cwd: path, stdio: "ignore" });
}

const cpuThreadCount = require("os").cpus().length;

/**
 *
 * @param {string} path
 * @param {string | string[]} branchNames
 * @param {object} options
 * @param {boolean} options.noSubmoduleUpdate
 * @param {boolean?} options.noThreads
 * @returns {Promise<string[]>}
 */
async function runSubmoduleUpdatesAndCheckout(path, branchNames, options) {
    const gitModulesPath = join(path, ".gitmodules");
    if (!existsSync(gitModulesPath)) {
        return [];
    }
    runExec(
        "git",
        ["submodule", "update", "--jobs", cpuThreadCount.toString()],
        { cwd: path, stdio: "ignore" },
    );
    /**
     * @type {Array<ReturnType<typeof checkoutBranches>>}
     */
    const subModuleTasks = [];
    for (const gitmodule of readGitmodules(gitModulesPath)) {
        const moduleName = gitmodule.path;
        const modulePath = resolve(path, moduleName);
        const task = checkoutBranches(
            modulePath,
            branchNames,
            options,
            console,
        );
        if (options.noThreads === true) {
            await task;
        }
        subModuleTasks.push(task);
    }
    return (await Promise.all(subModuleTasks)).flatMap((x) => x);
}

/**
 *
 * @param {string} path
 * @param {string | string[]} branchNames
 * @returns {Promise<string[]>}
 */
function checkoutBranchThread(path, branchNames) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(__filename, {
            workerData: {
                path,
                branchNames,
            },
        });

        worker.on("message", resolve);
        worker.on("error", (reason) => {
            reject(reason);
        });
        worker.on("exit", (code) => {
            if (code !== 0) {
                reject(new Error(`Worker stopped with exit code: ${code}`));
            }
        });
    });
}

/**
 *
 * @param {string} path
 * @param {string | string[]} branchNames
 * @param {object} options
 * @param {boolean} options.noSubmoduleUpdate
 * @param {boolean?} options.noThreads
 * @param {import("../utils/output/console-wrapper").ConsoleBase} console
 * @returns {Promise<string[]>}
 */
async function checkoutBranches(path, branchNames, options, console) {
    console.log("Run queue for " + path);

    /**
     * @type {Array<string>}
     */
    let checkoutBranchResult;
    if (options.noThreads !== true)
        checkoutBranchResult = await checkoutBranchThread(
            path,
            branchNames,
        );
    else {
        await checkoutBranch(
            path,
            branchNames,
            console,
        );
        checkoutBranchResult =
            "contents" in console && Array.isArray(console.contents)
                ? console.contents
                : [];
    }

    const { noSubmoduleUpdate } = options;
    if (noSubmoduleUpdate) return;

    const otherBranchResult = await runSubmoduleUpdatesAndCheckout(
        path,
        branchNames,
        options,
    );
    const lines = [checkoutBranchResult, otherBranchResult].flatMap((x) => x);
    return lines;
}

function getCommandLine() {
    const nodeName = process.argv0;
    const relPath = relative(cwd(), process.argv[1]);
    return `${nodeName} ${relPath}`;
}

function showUsage() {
    console.log(
        prettyFormatCommandUsage(getCommandLine(), {
            options: [
                {
                    identifier: "--acknowledge-risks-and-continue",
                    description: "Acknowledge the risks",
                    required: true,
                },
                {
                    identifier: "--no-threads",
                    description: "Don't run in parallel threads.",
                    requiredRemarks:
                        "Required if --pull-remotes is used without --nuke-remote.",
                },
                {
                    identifier: "--no-submodule-update",
                    description: "Dont update submodules",
                },
            ],
            values: [
                {
                    identifier: "repo-dir",
                    description: "Path to the main repo directory.",
                    required: true,
                },
                {
                    identifier: "branchname",
                    customNotation: "multiple-values-comma-separated",
                    description:
                        "Name(s) of the branch to create for the migration.\nIf multiple branches (like main and master), separate by comma and no spaces",
                },
            ],
        }),
    );
}

if (!isMainThread) {
    const console = createConsoleWrapper();
    try {
        checkoutBranch(workerData.path, workerData.branchNames, console).then(
            () => {
                parentPort.postMessage(console.contents);
            },
        );
    } catch (e) {
        if (e != null) {
            e.output = console.contents;
        }
        throw e;
    }
} else if (module.id == ".") {
    const argsLeftOver = process.argv.slice(2);
    if (pullFlag(argsLeftOver, "--help")) {
        showUsage();
        return;
    }
    const acknowledged = pullFlag(
        argsLeftOver,
        "--acknowledge-risks-and-continue",
    );
    const noSubmoduleUpdate = pullFlag(argsLeftOver, "--no-submodule-update");
    const noThreads = pullFlag(argsLeftOver, "--no-threads");
    const repoDir = pullValue(argsLeftOver);
    if (argsLeftOver.length == 0) {
        console.error("Missing args");
        showUsage();
        return;
    }
    const branchNames = pullValue(argsLeftOver).split(",");

    if (repoDir == null) {
        console.error("Missing repo dir");
        showUsage();
        return;
    }

    if (!existsSync(repoDir)) {
        throw new Error(`The directory does not exist: ${repoDir}`);
    }

    if (branchNames == null || branchNames.length == 0) {
        console.error("Missing branch names");
        showUsage();
        return;
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

    if (typeof repoDir != "string")
        throw new Error("A repo directory is required");
    const promise = checkoutBranches(
        repoDir,
        branchNames,
        {
            noSubmoduleUpdate: noSubmoduleUpdate,
            noThreads: noThreads,
        },
        console,
    );
    promise.then((lines) => {
        for (const line of lines) {
            console.log(line);
        }
    });
} else {
    module.exports.checkoutBranches = checkoutBranches;
}
