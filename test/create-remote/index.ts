import { Worker } from "worker_threads";
import { URL as NodeURL } from "url";
import { createRemote } from "./common";

export const createRemoteThread: (
    ...args: [
        Parameters<typeof createRemote>[0],
        Parameters<typeof createRemote>[1],
        Parameters<typeof createRemote>[2],
        Parameters<typeof createRemote>[3],
    ]
) => Promise<string[]> = function checkoutBranchThread(
    tempDir,
    moduleName,
    isSubmodule,
    customReadMeName,
) {
    if (moduleName === null) throw new Error("moduleName should not be null");
    if (moduleName === undefined)
        throw new Error("moduleName should not be undefined");
    if (tempDir === null) throw new Error("tempDir should not be null");
    if (tempDir === undefined)
        throw new Error("tempDir should not be undefined");
    return new Promise((resolve, reject) => {
        const worker = new Worker(
            /* webpackChunkName: "test_worker-create-remote" */
            new URL("./thread-worker.ts", import.meta.url) as NodeURL,
            {
                workerData: {
                    tempDir,
                    moduleName,
                    isSubmodule,
                    customReadMeName,
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
};
