const { runExec } = require("../../utils/process/run-exec");

/**
 *
 * @param {string} fullPath
 * @param {string} migrationBranchName
 */
function pushToOrigin(fullPath, migrationBranchName) {
    console.log("   Pushing to origin");

    runExec("git", ["push", "origin", migrationBranchName], {
        cwd: fullPath,
        stdio: "ignore",
    });
}

module.exports.pushToOrigin = pushToOrigin;
