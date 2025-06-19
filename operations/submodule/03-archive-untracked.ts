import { basename, relative, resolve } from "path";
import { ConsoleBase } from "../../utils/output/console-wrapper";
import { ensureSameCaseForPath } from "../../utils/path/ensure-same-case-for-path";
import { run } from "../../utils/process/run";
import { create } from "tar";

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
        }).stdout as string
    )
        .split("\n")
        .filter((x) => x != "")
        .map((x) => relative(mainRepoDir, resolve(fullPath, x.trim())));

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
}
