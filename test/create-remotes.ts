#!/bin/node
import { mkdirSync, rmSync, existsSync } from "fs";
import { resolve } from "path";
import { Submodule, submodules } from "./submodules";
import { cleanWithRetries } from "./utils/fs/clean-with-retries";
import { createRemoteThread } from "./create-remote";
import { testOutDir } from "./globals";

const remoteDir = resolve(testOutDir, "remote");

export async function createRemotes() {
    console.log("create remotes:");

    console.log("  clean " + resolve(remoteDir));

    if (existsSync(remoteDir)) {
        cleanWithRetries(remoteDir);
    } else {
        mkdirSync(remoteDir, { recursive: true });
    }

    const tempDir = resolve(remoteDir, "temp");
    mkdirSync(tempDir);

    console.log("  make local remotes directories");

    const createRemoteTasks: Promise<void>[] = [];

    for (const module of submodules
        .map(
            (x) =>
                ({ submodule: true, name: x.name, src: x }) as {
                    submodule: boolean;
                    name: string;
                    src: null | Submodule;
                },
        )
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
}
