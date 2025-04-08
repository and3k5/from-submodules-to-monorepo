const {
    ensureSameCaseForPath,
} = require("../../utils/path/ensure-same-case-for-path");
const { run } = require("../../utils/process/run");
const { runExec } = require("../../utils/process/run-exec");
const { basename, join } = require("path");

/**
 *
 * @param {string} mainRepoDir
 * @param {import("../../utils/git/read-gitmodules").Submodule} submodule
 * @param {import("../../utils/output/console-wrapper").ConsoleBase} console
 */
async function removeSubmodule(mainRepoDir, submodule, console) {
    console.log("   Removing submodule from main repo");

    run(
        "git",
        [
            "rm",
            "-f",
            basename(ensureSameCaseForPath(join(mainRepoDir, submodule.path))),
        ],
        {
            cwd: mainRepoDir,
        },
    );

    console.log("   Committing submodule removal");

    runExec("git", ["commit", "-m", `Remove submodule: ${submodule.path}`], {
        cwd: mainRepoDir,
    });
}
module.exports.removeSubmodule = removeSubmodule;
