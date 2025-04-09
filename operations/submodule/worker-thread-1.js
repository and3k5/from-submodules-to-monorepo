const {
    Worker,
    parentPort,
    workerData,
    isMainThread,
} = require("node:worker_threads");
const { introduceModule } = require("./01-intro");
const { checkoutModule } = require("./02-checkout");
const { moveFiles } = require("./03-move-files");
const { createConsoleWrapper } = require("../../utils/output/console-wrapper");
const { pushToOrigin } = require("./04-push-to-origin");

if (isMainThread) {
    /**
     * @param {string} mainRepoDir
     * @param {string} migrationBranchName
     * @param {string} fullPath
     * @param {import('../git/read-gitmodules').Submodule} submodule
     * @param {import('../git/read-gitmodules').Submodule[]} submodules
     * @param {boolean} deleteExistingBranches
     * @returns {Promise<string[]>}
     */
    function applyTransformationForSubmodule(
        mainRepoDir,
        migrationBranchName,
        fullPath,
        submodule,
        submodules,
        deleteExistingBranches,
    ) {
        return new Promise((resolve, reject) => {
            const worker = new Worker(__filename, {
                workerData: {
                    fullPath,
                    submodule,
                    submodules,
                    migrationBranchName,
                    mainRepoDir,
                    deleteExistingBranches,
                },
            });

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
    module.exports.applyTransformationForSubmodule =
        applyTransformationForSubmodule;
} else {
    const fullPath = workerData.fullPath;
    const submodule = workerData.submodule;
    const submodules = workerData.submodules;
    const migrationBranchName = workerData.migrationBranchName;
    const mainRepoDir = workerData.mainRepoDir;
    const deleteExistingBranches = workerData.deleteExistingBranches;

    const console = createConsoleWrapper();
    introduceModule(submodule, submodules, console);
    checkoutModule(
        fullPath,
        migrationBranchName,
        deleteExistingBranches,
        console,
    );
    moveFiles(mainRepoDir, fullPath, submodule, console);
    pushToOrigin(
        mainRepoDir,
        fullPath,
        migrationBranchName,
        submodule,
        console,
    );

    parentPort.postMessage(console.contents);
}
