const {
    createFileSystemRemote,
} = require("../../utils/git/create-file-system-remote");
const {
    fileSystemRemoteUrl,
} = require("../../utils/git/file-system-remote-url");
const {
    getOriginNameForSubmodule,
} = require("../../utils/git/origin-name-for-submodule");
const { run } = require("../../utils/process/run");
const { runExec } = require("../../utils/process/run-exec");
const { getRemotePath } = require("../../utils/storage/get-temp-remote-path");

/**
 * @param {string} mainRepoDir
 * @param {string} fullPath
 * @param {string} migrationBranchName
 * @param {import("../../utils/git/read-gitmodules").Submodule} submodule
 * @param {import("../../utils/output/console-wrapper").ConsoleBase} console
 */
function pushToOrigin(
    mainRepoDir,
    fullPath,
    migrationBranchName,
    submodule,
    console,
) {
    console.log("   Pushing to origin");

    const localRemotePath = createFileSystemRemote(
        getRemotePath(),
        getOriginNameForSubmodule(mainRepoDir, submodule),
    );
    const remoteUrl = fileSystemRemoteUrl(localRemotePath);

    const remoteName = "local_origin";

    try {
        runExec("git", ["remote", "remove", remoteName], {
            stdio: "ignore",
            cwd: fullPath,
        });
    } catch {
        // suppress
    }

    console.log(`   Adding remote: ${remoteUrl}`);

    run("git", ["remote", "add", remoteName, remoteUrl], {
        cwd: fullPath,
    });

    console.log(`   Pushing delete (existing) branch on remote: ${remoteName}`);
    try {
        runExec("git", ["push", remoteName, `:${migrationBranchName}`], {
            cwd: fullPath,
            stdio: "ignore",
        });
    } catch {
        // nothing
    }

    console.log(`   Pushing to remote: ${remoteName}`);

    runExec("git", ["push", remoteName, migrationBranchName], {
        cwd: fullPath,
        stdio: "ignore",
    });
}

module.exports.pushToOrigin = pushToOrigin;
