import { parentPort, workerData, isMainThread } from "worker_threads";
import { introduceModule } from "../01-intro";
import { checkoutModule } from "../02-checkout";
import { moveFiles } from "../04-move-files";
import { createConsoleWrapper } from "../../../utils/output/console-wrapper";
import { pushToOrigin } from "../05-push-to-origin";
import { archiveUntrackedFiles } from "../03-archive-untracked";

if (!isMainThread) {
    const fullPath = workerData.fullPath;
    const submodule = workerData.submodule;
    const submodules = workerData.submodules;
    const migrationBranchName = workerData.migrationBranchName;
    const mainRepoDir = workerData.mainRepoDir;
    const deleteExistingBranches = workerData.deleteExistingBranches;
    const keepUntrackedFilesPath = workerData.keepUntrackedFilesPath;

    const console = createConsoleWrapper();

    (async function () {
        introduceModule(submodule, submodules, console);
        checkoutModule(
            fullPath,
            migrationBranchName,
            deleteExistingBranches,
            console,
        );
        if (keepUntrackedFilesPath != null)
            await archiveUntrackedFiles(
                mainRepoDir,
                fullPath,
                submodule,
                keepUntrackedFilesPath,
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
    })();
} else {
    throw new Error("Should not be used directly");
}
