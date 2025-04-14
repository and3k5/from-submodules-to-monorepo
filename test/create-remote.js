const {
    isMainThread,
    Worker,
    workerData,
    parentPort,
} = require("worker_threads");
const {
    createFileSystemRemote,
} = require("../utils/git/create-file-system-remote");
const { run } = require("../utils/process/run");
const { createFile } = require("./utils/fs/create-file");
const { cloneRepo } = require("./utils/git/clone-repo");
const { gitAdd } = require("./utils/git/git-add");
const { gitCommit } = require("./utils/git/git-commit");
const { gitPush } = require("./utils/git/git-push");
const { resolve } = require("path");
const { createConsoleWrapper } = require("../utils/output/console-wrapper");

const remoteDir = resolve(__dirname, "remote");

/**
 *
 * @param {string} tempDir
 * @param {string} moduleName
 * @param {boolean} isSubmodule
 * @param {string?} customReadMeName
 * @param {import("../utils/output/console-wrapper").ConsoleBase} console
 */
function createRemote(
    tempDir,
    moduleName,
    isSubmodule,
    customReadMeName,
    console,
) {
    console.log("   - Module: " + moduleName);

    console.log("     tempDir: " + tempDir);
    createFileSystemRemote(remoteDir, moduleName);
    const actualDir = cloneRepo(moduleName, tempDir);

    run("git", ["config", "user.name", "example user"], { cwd: actualDir });
    run("git", ["config", "user.email", "user@example.com"], {
        cwd: actualDir,
    });

    console.log("     dir: " + actualDir);

    let readmeName = "README.md";
    if (customReadMeName != null) {
        readmeName = customReadMeName;
    }
    createFile(
        actualDir,
        readmeName,
        `This is the ${isSubmodule ? "submodule" : "main"} repo for ${moduleName}.`,
    );
    gitAdd(readmeName, actualDir);
    gitCommit("Added readme file", actualDir);
    gitPush("origin", "master", actualDir, true);
}

if (!isMainThread) {
    const consoleWrapper = createConsoleWrapper();
    createRemote(
        workerData.tempDir,
        workerData.moduleName,
        workerData.isSubmodule,
        workerData.customReadMeName,
        consoleWrapper,
    );
    parentPort.postMessage(consoleWrapper.contents);
} else {
    module.exports.createRemote = createRemote;

    /**
     * @type {((...args : Parameters<typeof createRemote>) => Promise<string[]>)}
     */
    const createRemoteThread = function checkoutBranchThread(
        tempDir,
        moduleName,
        isSubmodule,
        customReadMeName,
    ) {
        return new Promise((resolve, reject) => {
            const worker = new Worker(__filename, {
                workerData: {
                    tempDir,
                    moduleName,
                    isSubmodule,
                    customReadMeName,
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
    };

    module.exports.createRemoteThread = createRemoteThread;
}
