// git checkout main && git restore --staged . && git submodule update

const { cwd } = require("process");
const { pullFlag } = require("../utils/args/pull-flag");
const { pullValue } = require("../utils/args/pull-value");
const { getMatchingBranch } = require("../utils/git/get-matching-branch");
const { readGitmodules } = require("../utils/git/read-gitmodules");
const { runExec } = require("../utils/process/run-exec");
const { resolve, relative, join } = require("path");
const { existsSync } = require("fs");

/**
 *
 * @param {string} path
 * @param {string | string[]} branchNames
 * @param {object} options
 * @param {boolean} options.noSubmoduleUpdate
 */
function checkoutBranches(path, branchNames, { noSubmoduleUpdate }) {
    const matchingBranchName = getMatchingBranch(path, branchNames);
    if (matchingBranchName == null)
        throw new Error(
            "Has no matching branch names for any of the branches: " +
                branchNames.join(", "),
        );

    runExec("git", ["checkout", matchingBranchName], { cwd: path });
    runExec("git", ["restore", "--staged", "."], { cwd: path });
    if (!noSubmoduleUpdate) {
        runExec("git", ["submodule", "update"], { cwd: path });
        const gitModulesPath = join(path, ".gitmodules");
        if (!existsSync(gitModulesPath)) {
            return;
        }
        readGitmodules(gitModulesPath).forEach((gitmodule) => {
            const moduleName = gitmodule.path;
            const modulePath = resolve(path, moduleName);
            checkoutBranches(modulePath, branchNames, { noSubmoduleUpdate });
        });
    }
}

function getCommandLine() {
    const nodeName = process.argv0;
    const relPath = relative(cwd(), process.argv[1]);
    return `${nodeName} ${relPath}`;
}

function showUsage() {
    console.log("Usage:");
    console.log(
        `${getCommandLine()} <repo-dir> <branchname>[,<branchname>...] [--no-submodule-update] --acknowledge-risks-and-continue`,
    );
}

if (module.id == ".") {
    const argsLeftOver = process.argv.slice(2);
    const acknowledged = pullFlag(
        argsLeftOver,
        "--acknowledge-risks-and-continue",
    );
    const noSubmoduleUpdate = pullFlag(argsLeftOver, "--no-submodule-update");
    const repoDir = pullValue(argsLeftOver);
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
    checkoutBranches(repoDir, branchNames, {
        noSubmoduleUpdate: noSubmoduleUpdate,
    });
} else {
    module.exports.checkoutBranches = checkoutBranches;
}
