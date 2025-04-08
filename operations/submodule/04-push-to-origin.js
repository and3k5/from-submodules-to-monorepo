const { runExec } = require("../../utils/process/run-exec");

/**
 *
 * @param {string} fullPath
 * @param {string} migrationBranchName
 * @param {import("../../utils/output/console-wrapper").ConsoleBase} console
 */
function pushToOrigin(fullPath, migrationBranchName, console) {
    console.log("   Pushing to origin");

    runExec("git", ["push", "origin", migrationBranchName], {
        cwd: fullPath,
        stdio: "ignore",
    });
}

module.exports.pushToOrigin = pushToOrigin;
