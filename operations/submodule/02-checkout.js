const { run } = require("../../utils/process/run");
const { runExec } = require("../../utils/process/run-exec");

/**
 * @param {string} fullPath
 * @param {string} migrationBranchName
 * @param {boolean} deleteExistingBranches
 * @param {import("../../utils/output/console-wrapper").ConsoleBase} console
 */
function checkoutModule(
    fullPath,
    migrationBranchName,
    deleteExistingBranches,
    console,
) {
    if (deleteExistingBranches) {
        console.log("Trying to delete existing branch: " + migrationBranchName);
        try {
            runExec("git", ["branch", "-D", migrationBranchName], {
                cwd: fullPath,
                stdio: "ignore",
            });
        } catch {
            // nothing
        }
    }
    run("git", ["checkout", "-b", migrationBranchName], { cwd: fullPath });
    console.log(`   Created branch: ${migrationBranchName}`);
}
module.exports.checkoutModule = checkoutModule;
