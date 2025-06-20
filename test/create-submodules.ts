#!/bin/node
import { existsSync, mkdirSync } from "fs";
import { resolve } from "path";
import { createRemotes } from "./create-remotes";
import { run } from "../utils/process/run";
import { cloneRepo } from "./utils/git/clone-repo";
import { gitAdd } from "./utils/git/git-add";
import { gitPush } from "./utils/git/git-push";
import { gitCommit } from "./utils/git/git-commit";
import { cleanWithRetries } from "./utils/fs/clean-with-retries";
import { testOutDir } from "./globals";
import { createSubmodules } from "./submodules/create-submodules";

const devDir = resolve(testOutDir, "dev");
const mySystemDir = resolve(devDir, "my-system");

export const mainRepoDir = mySystemDir;


export async function createSubModules() {
    const remotes = await createRemotes();

    console.log("create submodules:");
    console.log("  clean "+devDir);
    if (!existsSync(devDir)) {
        mkdirSync(devDir, { recursive: true });
    }
    cleanWithRetries(devDir, [".gitignore"]);

    console.log("  clone my-system");
    cloneRepo("my-system", devDir);

    run("git", ["config", "--global", "protocol.file.allow", "always"], {
        cwd: mySystemDir,
        encoding: "utf-8",
    });

    run("git", ["config", "core.autocrlf", "false"], { cwd: mySystemDir });
    run("git", ["config", "user.name", "example user"], { cwd: mySystemDir });
    run("git", ["config", "user.email", "user@example.com"], {
        cwd: mySystemDir,
    });

    console.log("  add submodules to my-system");

    const submoduleNames = createSubmodules(remotes, mySystemDir);

    console.log("  add submodule change to my-system");
    for (const submoduleFolderName of submoduleNames) {
        console.log("   - " + submoduleFolderName);
        gitAdd(
            submoduleFolderName,
            mySystemDir,
        );
    }

    console.log("  commit my-system");
    gitCommit("Update ref", mySystemDir);

    console.log("  push to remote");
    gitPush("origin", "master", mySystemDir, true);

    console.log("  done!");

    return mySystemDir;
}

if (require.main?.id === module.id) {
    createSubModules();
}
