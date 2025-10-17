import { isMainThread, Worker } from "worker_threads";
import { URL as NodeURL } from "url";

export function performUnpackAllArchives(
    keepUntrackedFilesPath: string,
    mainRepoDir: string,
): Promise<string[]> {
    if (!isMainThread) {
        throw new Error("Should not be used inside thread");
    }
    return new Promise((resolve, reject) => {
        const worker = new Worker(
            /* webpackChunkName: "worker-perform-unpack-archives" */
            new URL("./thread-worker.ts", import.meta.url) as NodeURL,
            {
                name: "worker-perform-unpack-archives",
                workerData: {
                    keepUntrackedFilesPath,
                    mainRepoDir,
                },
            },
        );

        worker.on("message", resolve);
        worker.on("error", (reason) => {
            reject(reason);
        });
        worker.on("exit", (code) => {
            if (code !== 0) {
                reject(new Error(`Worker stopped with exit code: ${code}`));
            }
        });
    });
}
