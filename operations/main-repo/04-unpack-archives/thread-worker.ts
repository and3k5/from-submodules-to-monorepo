import { workerData, isMainThread, parentPort } from "worker_threads";
import { createConsoleWrapper } from "../../../utils/output/console-wrapper";
import { readdirSync } from "fs";
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
            await extract({
                file: filePath,
                cwd: mainRepoDir,
                onReadEntry: (entry) => console.log(`Read entry ${entry.path}`),
                onWriteEntry: (entry) => console.log(`Write entry ${entry.path}`),
            });
        }

        console.log("All tar files have been extracted.");
        parentPort?.postMessage(console.contents);
    })();
} else {
    throw new Error("Should not be used directly");
}
