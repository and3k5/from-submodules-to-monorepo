import { isMainThread, parentPort, workerData } from "worker_threads";
import { createConsoleWrapper } from "../../../utils/output/console-wrapper";
import { createRemote } from "./common";

if (!isMainThread) {
    const consoleWrapper = createConsoleWrapper();
    createRemote(
        workerData.tempDir,
        workerData.moduleName,
        workerData.isSubmodule,
        workerData.customReadMeName,
        consoleWrapper,
    );
    parentPort?.postMessage(consoleWrapper.contents);
} else {
    throw new Error("Should not be used directly");
}
