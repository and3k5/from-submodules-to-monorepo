const { run } = require("../../utils/process/run");

/**
 * @param {string} fullPath
 * @param {string} fullPath
 * @param {import("../../utils/output/console-wrapper").ConsoleBase} console
 */
function checkoutModule(fullPath, migrationBranchName, console) {
    run("git", ["checkout", "-b", migrationBranchName], { cwd: fullPath });
    console.log(`   Created branch: ${migrationBranchName}`);
}
module.exports.checkoutModule = checkoutModule;
