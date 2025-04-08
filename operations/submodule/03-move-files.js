const { existsSync, renameSync, mkdirSync } = require("node:fs");
const { relative, join } = require("node:path");
const { run } = require("../../utils/process/run");
const { sameDirName } = require("../../utils/path/same-dir-name");
const { runExec } = require("../../utils/process/run-exec");

/**
 *
 * @param {string} mainRepoDir
 * @param {string} fullPath
 * @param {import("../../utils/git/read-gitmodules").Submodule} submodule
 * @param {import("../../utils/output/console-wrapper").ConsoleBase} console
 */
function moveFiles(mainRepoDir, fullPath, submodule, console) {
    const targetPath = join(fullPath, submodule.path);
    console.log(
        `   Moving ${relative(mainRepoDir, fullPath)} to ${relative(mainRepoDir, targetPath)}`,
    );
    const targetPathExists = existsSync(targetPath);
    const tempNameForExistingPath = `${submodule.path}_TEMP_DUP`;
    if (targetPathExists) {
        renameSync(targetPath, join(fullPath, tempNameForExistingPath));
    }

    mkdirSync(targetPath, { recursive: true });

    const entries = run("git", ["ls-tree", "--name-only", "HEAD"], {
        encoding: "utf-8",
        cwd: fullPath,
    })
        .stdout.split("\n")
        .filter((e) => e != "");

    for (const entry of entries) {
        if (sameDirName(entry, submodule.path)) continue;
        run("git", ["mv", `${fullPath}/${entry}`, targetPath], {
            cwd: fullPath,
        });
    }

    if (targetPathExists) {
        renameSync(
            join(fullPath, tempNameForExistingPath),
            join(targetPath, submodule.path),
        );
    }

    console.log("   Adding moved files to commit");

    runExec("git", ["add", "."], { cwd: fullPath, stdio: "ignore" });
    runExec("git", ["commit", "-m", "Moving submodule files"], {
        cwd: fullPath,
        stdio: "ignore",
    });
}
module.exports.moveFiles = moveFiles;
