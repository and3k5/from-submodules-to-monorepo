import { workerData, isMainThread, parentPort } from "worker_threads";
import { createConsoleWrapper } from "../../../utils/output/console-wrapper";
import { existsSync, readdirSync } from "fs";
import { join } from "path";
import { extract } from "tar";

if (!isMainThread) {
    const keepUntrackedFilesPath = workerData.keepUntrackedFilesPath;
    const mainRepoDir = workerData.mainRepoDir;

    const console = createConsoleWrapper();

    const files = readdirSync(keepUntrackedFilesPath).filter((file) =>
        file.endsWith(".tar.gz"),
    );
    (async function () {
        if (files.length === 0) {
            console.log("No tar files found in the specified directory.");
            parentPort?.postMessage(console.contents);
            return;
        }
        for (const file of files) {
            const filePath = join(keepUntrackedFilesPath, file);
            console.log(`Extracting ${filePath} to ${mainRepoDir}`);
            const pathsToCheck: string[] = [];
            await extract({
                file: filePath,
                cwd: mainRepoDir,
                onReadEntry: (entry) => {
                    pathsToCheck.push(entry.path);
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
                }else{
                    console.log(actualPath+" exists!");
                }
            }
        }

        console.log("All tar files have been extracted.");
        parentPort?.postMessage(console.contents);
    })();
} else {
    throw new Error("Should not be used directly");
}
