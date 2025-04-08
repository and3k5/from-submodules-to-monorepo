const {
    autoResolveConflicts,
} = require("../../transformation/auto-resolve-conflicts");
const { run } = require("../../utils/process/run");

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

    const remoteUrl = submodule.url;
    const remoteName = `origin_${submodule.path}`;

    let remoteExists = false;
    let createNewRemote = true;
    try {
        const existingRemoteUrl = run(
            "git",
            ["remote", "get-url", "--all", remoteName],
            {
                cwd: mainRepoDir,
                encoding: "utf-8",
            },
        ).stdout.trim();
        if (existingRemoteUrl != null && existingRemoteUrl != "") {
            remoteExists = true;
        }
        if (remoteExists) {
            if (existingRemoteUrl === remoteUrl) {
                createNewRemote = false;
                console.log(`   Remote ${remoteName} already exists!`);
            } else {
                console.warn(
                    `   Remote ${remoteName} already exists but url is ${existingRemoteUrl}`,
                );
            }
        }
    } catch {
        remoteExists = false;
    }

    if (!remoteExists || createNewRemote) {
        if (remoteExists) {
            throw new Error("Origin exists but has different url");
        }

        console.log(`   Adding remote: ${remoteUrl}`);

        run("git", ["remote", "add", remoteName, remoteUrl], {
            cwd: mainRepoDir,
        });
    }

    console.log(`   Pull origin branch into main repo`);

    run("git", ["fetch", remoteName, migrationBranchName], {
        cwd: mainRepoDir,
    });
    try {
        run(
            "git",
            [
                "merge",
                "--allow-unrelated-histories",
                "-s",
                "recursive",
                "-Xno-renames",
                `${remoteName}/${migrationBranchName}`,
            ],
            { cwd: mainRepoDir },
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
