import { isMainThread, parentPort, workerData } from "worker_threads";
import { createConsoleWrapper } from "../../utils/output/console-wrapper";
import { checkoutBranch } from "./common";

if (!isMainThread) {
    const console = createConsoleWrapper();
    try {
        checkoutBranch(
            workerData.path,
            workerData.branchNames,
            {
                pullRemotes: workerData.pullRemotes,
                nukeRemote: workerData.nukeRemote,
            },
            console,
            workerData.isSubmodule,
        ).then(() => {
            parentPort?.postMessage(console.contents);
        });
    } catch (e) {
        if (e != null) {
            e.output = console.contents;
        }
        throw e;
    }
} else {
    throw new Error("Should not be used directly");
}
