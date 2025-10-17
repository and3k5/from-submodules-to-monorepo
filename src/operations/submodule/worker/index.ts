import { Worker, isMainThread } from "worker_threads";
import { URL as NodeURL } from "url";
import { Submodule } from "../../../utils/git/read-gitmodules";

export function applyTransformationForSubmodule(
    mainRepoDir: string,
    migrationBranchName: string,
    fullPath: string,
    submodule: Submodule,
    submodules: Submodule[],
    deleteExistingBranches: boolean,
    keepUntrackedFilesPath: string | undefined,
): Promise<string[]> {
    if (!isMainThread) {
        throw new Error("Should not be used inside thread");
    }
    return new Promise((resolve, reject) => {
        const worker = new Worker(
            /* webpackChunkName: "worker-apply-transformation" */
            new URL("./thread-worker.ts", import.meta.url) as NodeURL,
            {
                workerData: {
                    fullPath,
                    submodule,
                    submodules,
                    migrationBranchName,
                    mainRepoDir,
                    deleteExistingBranches,
                    keepUntrackedFilesPath,
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
