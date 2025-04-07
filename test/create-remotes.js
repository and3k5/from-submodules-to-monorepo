#!/bin/node
const { mkdirSync, rmSync, existsSync } = require("fs");
const { resolve } = require("path");
const { submodules } = require("./submodules");
const { run } = require("../utils/process/run");
const { createFile } = require("./utils/fs/create-file");
const { cloneRepo } = require("./utils/git/clone-repo");
const { gitAdd } = require("./utils/git/git-add");
const { gitCommit } = require("./utils/git/git-commit");
const { gitPush } = require("./utils/git/git-push");
const { cleanWithRetries } = require("./utils/fs/clean-with-retries");

const remoteDir = resolve(__dirname, "remote");

function makeRemote(name) {
    const dirPath = resolve(remoteDir, name);
    mkdirSync(dirPath);
    run("git", ["init", "--bare"], {
        cwd: dirPath,
        encoding: "utf-8",
    });
    run("git", ["symbolic-ref", "HEAD", "refs/heads/master"], {
        cwd: dirPath,
        encoding: "utf-8",
    });
}

async function createRemotes() {
    console.log("create remotes:");

    console.log("  clean " + resolve(remoteDir));

    if (existsSync(remoteDir)) {
        cleanWithRetries(remoteDir);
    } else {
        mkdirSync(remoteDir);
    }

    const tempDir = resolve(remoteDir, "temp");
    mkdirSync(tempDir);

    console.log("  make local remotes directories");
    for (const module of submodules
        .map((x) => ({ submodule: true, name: x.name, src: x }))
        .concat([{ submodule: false, name: "my-system", src: null }])) {
        console.log("   - Module: " + module.name);

        console.log("     tempDir: " + tempDir);
        makeRemote(module.name + ".git");
        const actualDir = cloneRepo(module.name, tempDir);

        run("git", ["config", "user.name", "example user"], { cwd: actualDir });
        run("git", ["config", "user.email", "user@example.com"], {
            cwd: actualDir,
        });

        console.log("     dir: " + actualDir);

        let readmeName = "README.md";
        if (module.src != null && module.src.customReadMeName != null) {
            readmeName = module.src.customReadMeName;
        }
        createFile(
            actualDir,
            readmeName,
            `This is the ${module.submodule ? "submodule" : "main"} repo for ${module.name}.`,
        );
        gitAdd(readmeName, actualDir);
        gitCommit("Added readme file", actualDir);
        gitPush("origin", "master", actualDir, true);
    }

    rmSync(tempDir, {
        recursive: true,
    });
}

if (module.id == ".") {
    createRemotes();
} else {
    module.exports.createRemotes = createRemotes;
}
