const { existsSync, renameSync, mkdirSync } = require("node:fs");
const { relative, join, basename } = require("node:path");
const { run } = require("../../utils/process/run");
const { sameDirName } = require("../../utils/path/same-dir-name");
const { runExec } = require("../../utils/process/run-exec");
const {
    ensureSameCaseForPath,
} = require("../../utils/path/ensure-same-case-for-path");
const { platform } = require("node:os");

/**
 *
 * @param {string} mainRepoDir
 * @param {string} fullPath
 * @param {import("../../utils/git/read-gitmodules").Submodule} submodule
 * @param {import("../../utils/output/console-wrapper").ConsoleBase} console
 */
function moveFiles(mainRepoDir, fullPath, submodule, console) {
    fullPath = ensureSameCaseForPath(fullPath);
    const correctCasedSubmodulePath = basename(fullPath);
    const targetPath = join(fullPath, correctCasedSubmodulePath);
    console.log(
        `   Moving ${relative(mainRepoDir, fullPath)} to ${relative(mainRepoDir, targetPath)}`,
    );
    const tempKeyword = "_TEMP_DUP";
    const targetPathExists = existsSync(targetPath);
    const tempNameForExistingPath = `${basename(ensureSameCaseForPath(targetPath))}${tempKeyword}`;
    if (targetPathExists) {
        run(
            "git",
            [
                "mv",
                relative(fullPath, ensureSameCaseForPath(targetPath)),
                relative(fullPath, join(fullPath, tempNameForExistingPath)),
            ],
            {
                cwd: fullPath,
            },
        );
    }

    mkdirSync(targetPath, { recursive: true });

    const entries = run("git", ["ls-tree", "--name-only", "HEAD"], {
        encoding: "utf-8",
        cwd: fullPath,
    })
        .stdout.split("\n")
        .filter((e) => e != "");

    for (const entry of entries) {
        if (sameDirName(entry, correctCasedSubmodulePath)) continue;
        const entryPath = `${fullPath}/${entry}`;
        if (
            platform() == "win32" &&
            !existsSync(entryPath) &&
            entries.some(
                (x) => x !== entry && x.toUpperCase() == entry.toUpperCase(),
            )
        ) {
            continue;
        }
        console.log(
            "      mv " +
                relative(mainRepoDir, entryPath) +
                " " +
                relative(mainRepoDir, targetPath),
        );
        run("git", ["mv", entryPath, targetPath], {
            cwd: fullPath,
        });
    }

    if (targetPathExists) {
        renameSync(
            join(fullPath, tempNameForExistingPath),
            join(
                targetPath,
                tempNameForExistingPath.substring(
                    0,
                    tempNameForExistingPath.length - tempKeyword.length,
                ),
            ),
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
