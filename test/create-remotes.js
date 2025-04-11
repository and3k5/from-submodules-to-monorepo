#!/bin/node
const { mkdirSync, rmSync, existsSync } = require("fs");
const { resolve } = require("path");
const { submodules } = require("./submodules");
const { cleanWithRetries } = require("./utils/fs/clean-with-retries");
const { createRemoteThread } = require("./create-remote");

const remoteDir = resolve(__dirname, "remote");

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

    /**
     * @type {Promise<void>[]}
     */
    const createRemoteTasks = [];

    for (const module of submodules
        .map((x) => ({ submodule: true, name: x.name, src: x }))
        .concat([{ submodule: false, name: "my-system", src: null }])) {
        const createRemoteTask = createRemoteThread(
            tempDir,
            module.name,
            module.submodule,
            module.src?.customReadMeName,
        ).then((contents) => {
            console.log(contents.join("\n"));
        });
        createRemoteTasks.push(createRemoteTask);
    }
    await Promise.all(createRemoteTasks);

    rmSync(tempDir, {
        recursive: true,
    });
}

if (module.id == ".") {
    createRemotes();
} else {
    module.exports.createRemotes = createRemotes;
}
