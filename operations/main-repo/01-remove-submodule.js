const { runExec } = require("../../utils/process/run-exec");

/**
 *
 * @param {string} mainRepoDir
 * @param {import("../../utils/git/read-gitmodules").Submodule} submodule
 * @param {import("../../utils/output/console-wrapper").ConsoleBase} console
 */
async function removeSubmodule(mainRepoDir, submodule, console) {
    console.log("   Removing submodule from main repo");

    runExec("git", ["rm", "-f", submodule.path], {
        cwd: mainRepoDir,
        stdio: "ignore",
    });

    console.log("   Committing submodule removal");

    runExec("git", ["commit", "-m", `Remove submodule: ${submodule.path}`], {
        cwd: mainRepoDir,
    });
}
module.exports.removeSubmodule = removeSubmodule;
