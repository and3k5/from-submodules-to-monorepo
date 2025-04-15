import { createFileSystemRemote } from "../../utils/git/create-file-system-remote";
import { run } from "../../utils/process/run";
import { createFile } from "../utils/fs/create-file";
import { cloneRepo } from "../utils/git/clone-repo";
import { gitAdd } from "../utils/git/git-add";
import { gitCommit } from "../utils/git/git-commit";
import { gitPush } from "../utils/git/git-push";
import {
    ConsoleBase,
} from "../../utils/output/console-wrapper";
import { resolve } from "path";
import { testOutDir } from "../globals";

const remoteDir = resolve(testOutDir, "remote");

export function createRemote(
    tempDir: string,
    moduleName: string,
    isSubmodule: boolean,
    customReadMeName: string | undefined | null,
    console: ConsoleBase,
) {
    if (moduleName === null) throw new Error("moduleName should not be null")
    if (moduleName === undefined) throw new Error("moduleName should not be undefined")
    if (tempDir === null) throw new Error("tempDir should not be null")
    if (tempDir === undefined) throw new Error("tempDir should not be undefined")
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