#!/bin/node
import { mkdirSync, rmSync, existsSync } from "fs";
import { resolve } from "path";
import { getSubmodules } from "./submodules/test-submodules";
import { cleanWithRetries } from "./utils/fs/clean-with-retries";
import { testOutDir } from "../globals";
import { Submodule } from "./submodules";
import { createRemote } from "./createRemote";

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

    const createRemoteTasks: Promise<{ name: string }>[] = [];

    for (const module of getSubmodules()
        .map(
            (x) =>
                ({ submodule: true, name: x.name, src: x }) as {
                    submodule: boolean;
                    name: string;
                    src: null | Submodule;
                },
        )
        .concat([{ submodule: false, name: "my-system", src: null }])) {
        createRemote(
            tempDir,
            module.name,
            module.submodule,
            module.src?.customReadMeName,
            console,
        );
        createRemoteTasks.push(Promise.resolve({ name: module.name }));
    }
    const results = await Promise.all(createRemoteTasks);

    rmSync(tempDir, {
        recursive: true,
    });

    return results.map((x) => x.name);
}

if (import.meta.main) {
    createRemotes();
}
