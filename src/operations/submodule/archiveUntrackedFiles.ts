import { existsSync } from "fs";
import { basename, relative, resolve } from "path";
import { create } from "tar";
import { ConsoleBase } from "../../utils/output/console-wrapper";
import { ensureSameCaseForPath } from "../../utils/path/ensure-same-case-for-path";
import { run } from "../../utils/process/run";

export async function archiveUntrackedFiles(
    mainRepoDir: string,
    fullPath: string,
    submodule,
    keepUntrackedFilesPath: string,
    console: ConsoleBase,
) {
    fullPath = ensureSameCaseForPath(fullPath);
    const correctCasedSubmodulePath = basename(fullPath);
    const files = (
        run("git", ["ls-files", "--others"], {
            encoding: "utf-8",
            cwd: fullPath,
            maxBuffer: 100 * 1024 * 1024,
        }).stdout as string
    )
        .split("\n")
        .filter((x) => x != "")
        // node-tar (and the extraction step in performUnpackAllArchives) expect
        // forward-slash entry paths rooted at mainRepoDir, so normalise separators.
        .map((x) =>
            relative(mainRepoDir, resolve(fullPath, x.trim())).replaceAll(
                "\\",
                "/",
            ),
        );

    if (files.length == 0) {
        console.log("      No untracked files to archive");
        return;
    }

    console.log("      Archiving untracked files:");
    for (const file of files) {
        console.log(`        ${file}`);
    }

    const archivePath = resolve(
        keepUntrackedFilesPath,
        `${correctCasedSubmodulePath}.tar.gz`,
    );

    await create(
        {
            gzip: {
                async: true,
            },
            file: archivePath,
            C: mainRepoDir,
            onReadEntry: (entry) => console.log(`Read entry ${entry.path}`),
            onWriteEntry: (entry) => console.log(`Write entry ${entry.path}`),
        },
        files,
    );

    console.log("      Arvhive created:");
    console.log(`        ${archivePath}`);

    console.log("      Running git clean");
    run("git", ["clean", "-fdx"], {
        cwd: fullPath,
    });

    for (const file of files) {
        if (existsSync(file)) {
            throw new Error(`File ${file} does still exist!`);
        }
    }
}
