import { parentPort, workerData, isMainThread } from "worker_threads";
import { introduceModule } from "../01-intro";
import { checkoutModule } from "../02-checkout";
import { moveFiles } from "../03-move-files";
import { createConsoleWrapper } from "../../../utils/output/console-wrapper";
import { pushToOrigin } from "../04-push-to-origin";

if (!isMainThread) {
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

    parentPort?.postMessage(console.contents);
} else {
    throw new Error("Should not be used directly");
}
