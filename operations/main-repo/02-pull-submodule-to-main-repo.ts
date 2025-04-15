import { autoResolveConflicts } from "../../transformation/auto-resolve-conflicts";
import { createFileSystemRemote } from "../../utils/git/create-file-system-remote";
import { fileSystemRemoteUrl } from "../../utils/git/file-system-remote-url";
import { run } from "../../utils/process/run";
import { getRemotePath } from "../../utils/storage/get-temp-remote-path";
import { getOriginNameForSubmodule } from "../../utils/git/origin-name-for-submodule";
import { execFileSync } from "child_process";
import { Submodule } from "../../utils/git/read-gitmodules";
import { ConsoleBase } from "../../utils/output/console-wrapper";

export async function pullSubmoduleToMainRepo(
    mainRepoDir: string,
    submodule: Submodule,
    migrationBranchName: string,
    console: ConsoleBase,
): Promise<void> {
    console.log("   Pulling submodule into main repo");

    const localRemotePath = createFileSystemRemote(
        getRemotePath(),
        getOriginNameForSubmodule(mainRepoDir, submodule),
    );
    const remoteUrl = fileSystemRemoteUrl(localRemotePath);
    const remoteName = `origin_${submodule.path}`;

    try {
        execFileSync("git", ["remote", "remove", remoteName], {
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
        execFileSync(
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
