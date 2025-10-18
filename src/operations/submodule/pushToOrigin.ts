import { execFileSync } from "child_process";
import { createFileSystemRemote } from "../../utils/git/create-file-system-remote";
import { fileSystemRemoteUrl } from "../../utils/git/file-system-remote-url";
import { getOriginNameForSubmodule } from "../../utils/git/origin-name-for-submodule";
import { Submodule } from "../../utils/git/read-gitmodules";
import { ConsoleBase } from "../../utils/output/console-wrapper";
import { run } from "../../utils/process/run";
import { getRemotePath } from "../../utils/storage/get-temp-remote-path";

export function pushToOrigin(
    mainRepoDir: string,
    fullPath: string,
    migrationBranchName: string,
    submodule: Submodule,
    console: ConsoleBase,
) {
    console.log("      Pushing to origin (file system)");
    console.log("         Create remote (stored in file system)");

    const localRemotePath = createFileSystemRemote(
        getRemotePath(),
        getOriginNameForSubmodule(mainRepoDir, submodule),
    );
    const remoteUrl = fileSystemRemoteUrl(localRemotePath);

    const remoteName = "local_origin";

    try {
        execFileSync("git", ["remote", "remove", remoteName], {
            stdio: "ignore",
            cwd: fullPath,
        });
    } catch {
        // suppress
    }

    console.log(`         Adding remote: ${remoteUrl}`);

    run("git", ["remote", "add", remoteName, remoteUrl], {
        cwd: fullPath,
    });

    try {
        execFileSync("git", ["push", remoteName, `:${migrationBranchName}`], {
            cwd: fullPath,
            stdio: "ignore",
        });
        console.log(
            `         Deleted existing branch on remote: ${remoteName}`,
        );
    } catch {
        // nothing
    }

    console.log(`         Pushing to remote: ${remoteName}`);

    execFileSync("git", ["push", remoteName, migrationBranchName], {
        cwd: fullPath,
        stdio: "ignore",
    });
}
