import { execFileSync } from "child_process";
import { existsSync, mkdirSync, renameSync } from "fs";
import { platform } from "os";
import { basename, join, relative } from "path/posix";
import { Submodule } from "../../utils/git/read-gitmodules";
import { ConsoleBase } from "../../utils/output/console-wrapper";
import { ensureSameCaseForPath } from "../../utils/path/ensure-same-case-for-path";
import { sameDirName } from "../../utils/path/same-dir-name";
import { run } from "../../utils/process/run";

export function moveFiles(
    mainRepoDir: string,
    fullPath: string,
    submodule: Submodule,
    console: ConsoleBase,
) {
    fullPath = ensureSameCaseForPath(fullPath);
    const correctCasedSubmodulePath = basename(fullPath);
    const targetPath = join(fullPath, correctCasedSubmodulePath);
    console.log(
        `      Moving ${relative(mainRepoDir, fullPath)} to ${relative(mainRepoDir, targetPath)}`,
    );
    const tempKeyword = "_TEMP_DUP";
    const targetPathExists = existsSync(targetPath);
    const tempNameForExistingPath = `${basename(ensureSameCaseForPath(targetPath))}${tempKeyword}`;
    if (targetPathExists) {
        console.log(
            `         Target path already exists, moving it to ${tempNameForExistingPath}`,
        );
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

    const entries = (
        run("git", ["ls-tree", "--name-only", "HEAD"], {
            encoding: "utf-8",
            cwd: fullPath,
        }).stdout as string
    )
        .split("\n")
        .map((x) => x.trim())
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
            "            mv " +
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

    console.log("         Stage files to commit");

    execFileSync("git", ["add", "."], { cwd: fullPath, stdio: "ignore" });

    console.log("         Commit");

    execFileSync("git", ["commit", "-m", "Moving submodule files"], {
        cwd: fullPath,
        stdio: "ignore",
    });
}
