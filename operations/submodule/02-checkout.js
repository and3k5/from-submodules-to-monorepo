const { run } = require("../../utils/process/run");

/**
 * @param {string} fullPath
 * @param {string} fullPath
 */
function checkoutModule(fullPath, migrationBranchName) {
    run("git", ["checkout", "-b", migrationBranchName], { cwd: fullPath });
    console.log(`   Created branch: ${migrationBranchName}`);
}
module.exports.checkoutModule = checkoutModule;
