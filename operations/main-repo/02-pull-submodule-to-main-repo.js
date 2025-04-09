const {
    autoResolveConflicts,
} = require("../../transformation/auto-resolve-conflicts");
const {
    createFileSystemRemote,
} = require("../../utils/git/create-file-system-remote");
const {
    fileSystemRemoteUrl,
} = require("../../utils/git/file-system-remote-url");
const { run } = require("../../utils/process/run");
const { runExec } = require("../../utils/process/run-exec");
const { getRemotePath } = require("../../utils/storage/get-temp-remote-path");
const {
    getOriginNameForSubmodule,
} = require("../../utils/git/origin-name-for-submodule");

/**
 * @param {string} mainRepoDir
 * @param {import("../../utils/git/read-gitmodules").Submodule} submodule
 * @param {string} migrationBranchName
 * @param {import("../../utils/output/console-wrapper").ConsoleBase} console
 * @returns {Promise<void>}
 */
async function pullSubmoduleToMainRepo(
    mainRepoDir,
    submodule,
    migrationBranchName,
    console,
) {
    console.log("   Pulling submodule into main repo");

    const localRemotePath = createFileSystemRemote(
        getRemotePath(),
        getOriginNameForSubmodule(mainRepoDir, submodule),
    );
    const remoteUrl = fileSystemRemoteUrl(localRemotePath);
    const remoteName = `origin_${submodule.path}`;

    try {
        runExec("git", ["remote", "remove", remoteName], {
            stdio: "ignore",
            cwd: mainRepoDir,
        });
    } catch {
        // suppress
    }

    console.log(`   Adding remote: ${remoteUrl}`);

    run("git", ["remote", "add", remoteName, remoteUrl], {
        cwd: mainRepoDir,
    });

    console.log(`   Pull origin branch into main repo`);

    run(
        "git",
        ["fetch", "--no-auto-maintenance", remoteName, migrationBranchName],
        {
            cwd: mainRepoDir,
        },
    );
    try {
        runExec(
            "git",
            [
                "merge",
                "--allow-unrelated-histories",
                "-s",
                "recursive",
                "-Xno-renames",
                `${remoteName}/${migrationBranchName}`,
            ],
            { cwd: mainRepoDir, stdio: "ignore" },
        );
    } catch (error) {
        if (
            error.status !== 1 ||
            !(await autoResolveConflicts(mainRepoDir, false))
        ) {
            throw error;
        }
    }
}
module.exports.pullSubmoduleToMainRepo = pullSubmoduleToMainRepo;
