import { createConsoleWrapper } from "../../../utils/output/console-wrapper";
import { existsSync, readdirSync } from "fs";
import { join } from "path";
import { extract, list } from "tar";

export async function performUnpackAllArchives(
    keepUntrackedFilesPath: string,
    mainRepoDir: string,
): Promise<string[]> {
    const console = createConsoleWrapper();

    const files = readdirSync(keepUntrackedFilesPath).filter((file) =>
        file.endsWith(".tar.gz"),
    );

    if (files.length === 0) {
        console.log("No tar files found in the specified directory.");
        return console.contents;
    }
    for (const file of files) {
        const filePath = join(keepUntrackedFilesPath, file);
        console.log(`Extracting ${filePath} to ${mainRepoDir}`);
        const pathsToCheck: string[] = [];
        await list({
            file: filePath,
            onReadEntry: (entry) => {
                pathsToCheck.push(entry.path);
            },
        });
        for (const pathToCheck of pathsToCheck) {
            const actualPath = join(mainRepoDir, pathToCheck);
            if (existsSync(actualPath)) {
                throw new Error(`File ${actualPath} should not exist`);
            }
        }
        await extract({
            file: filePath,
            cwd: mainRepoDir,
            onReadEntry: (entry) => {
                console.log(`Read entry ${entry.path}`);
            },
            onWriteEntry: (entry) => {
                // this shouldn't be called
                console.log(`Write entry ${entry.path}`);
            },
        });
        for (const pathToCheck of pathsToCheck) {
            const actualPath = join(mainRepoDir, pathToCheck);
            if (!existsSync(actualPath)) {
                throw new Error(
                    `Unpack of ${file} should result in a file to exist but it didn't. File path: ${actualPath}`,
                );
            }
        }
    }

    console.log("All tar files have been extracted.");
    return console.contents;
}
