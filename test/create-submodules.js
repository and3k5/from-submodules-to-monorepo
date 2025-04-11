#!/bin/node
const { mkdirSync, writeFileSync } = require("fs");
const { resolve } = require("path");
const { createRemotes } = require("./create-remotes");
const { submodules } = require("./submodules");
const { words } = require("./lorem");
const { run } = require("../utils/process/run");
const { createFile } = require("./utils/fs/create-file");
const { cloneRepo } = require("./utils/git/clone-repo");
const { gitAdd } = require("./utils/git/git-add");
const { gitPush } = require("./utils/git/git-push");
const { gitCommit } = require("./utils/git/git-commit");
const {
    capitalizeFirstLetter,
} = require("./utils/string/capitalize-first-letter");
const { cleanWithRetries } = require("./utils/fs/clean-with-retries");
const { remotePath } = require("./utils/git/remote-path");
const { gitRemoteBase } = require("./globals");
const { platform } = require("os");

const devDir = resolve(__dirname, "dev");
const mySystemDir = resolve(devDir, "my-system");

function randomFileName() {
    return words(3)
        .split(" ")
        .map((x) => capitalizeFirstLetter(x))
        .join("");
}

/**
 * @param {string} dir
 * @param {import("./submodules").Submodule} submodule
 * @param {number} [depth=2]
 */
function makeRandomHistory(dir, submodule, depth = 2, currentDepth = 0) {
    let l = 1 + Math.round(Math.random() * 2);
    for (let i = 0; i < l; i++) {
        const fileName = randomFileName() + ".txt";
        createFile(dir, fileName, words(150 + Math.round(Math.random() * 100)));
        gitAdd(fileName, dir);
        gitCommit("Add " + fileName, dir);
    }

    if (depth > 0) {
        l = 1 + Math.round(Math.random() * 2);
        for (let i = 0; i < l; i++) {
            const subDir = resolve(dir, randomFileName());
            mkdirSync(subDir);
            makeRandomHistory(subDir, submodule, depth - 1, currentDepth + 1);
        }
    }
}

async function createSubModules() {
    await createRemotes();

    console.log("create submodules:");
    console.log("  clean ./dev/");
    cleanWithRetries(devDir, [".gitignore"]);

    console.log("  clone my-system");
    cloneRepo("my-system", devDir);

    run("git", ["config", "--global", "protocol.file.allow", "always"], {
        cwd: mySystemDir,
        encoding: "utf-8",
    });

    run("git", ["config", "user.name", "example user"], { cwd: mySystemDir });
    run("git", ["config", "user.email", "user@example.com"], {
        cwd: mySystemDir,
    });

    console.log("  add submodules to my-system");
    for (const submodule of submodules) {
        if (submodule.skipAddAsSubmodule === true) continue;
        console.log("   - " + submodule.name);

        const remotePath = gitRemoteBase + "/" + submodule.name + ".git";
        run(
            "git",
            [
                "submodule",
                "add",
                ...(submodule.renameFolder != null
                    ? ["--name", submodule.renameFolder]
                    : []),
                remotePath,
            ],
            {
                cwd: mySystemDir,
                encoding: "utf-8",
            },
        );

        if (submodule.renameFolder != null) {
            if (
                platform() == "win32" &&
                submodule.renameFolder.toUpperCase() ==
                    submodule.name.toUpperCase()
            ) {
                // windows borks if we try to rename the folder to the same name but with same casing
                run(
                    "git",
                    ["mv", submodule.name, submodule.renameFolder + "-temp"],
                    {
                        cwd: mySystemDir,
                    },
                );
                run(
                    "git",
                    [
                        "mv",
                        submodule.renameFolder + "-temp",
                        submodule.renameFolder,
                    ],
                    {
                        cwd: mySystemDir,
                    },
                );
            } else {
                run("git", ["mv", submodule.name, submodule.renameFolder], {
                    cwd: mySystemDir,
                });
            }
        }

        gitAdd(
            submodule.renameFolder != null
                ? submodule.renameFolder
                : submodule.name,
            mySystemDir,
        );
        gitCommit(
            "Added submodule: " +
                submodule.name +
                (submodule.renameFolder != null
                    ? "as folder " + submodule.renameFolder
                    : ""),
            mySystemDir,
        );
    }

    console.log("  generate some random file history");
    const outputs = await Promise.all(
        submodules
            .filter((x) => x.skipAddAsSubmodule !== true)
            .map((submodule) => {
                return (async function () {
                    /**
                     * @type {string[]}
                     */
                    const logs = [];
                    logs.push("  - " + submodule.name);
                    const actualDir = resolve(
                        mySystemDir,
                        submodule.renameFolder != null
                            ? submodule.renameFolder
                            : submodule.name,
                    );
                    run("git", ["config", "user.name", "example user"], {
                        cwd: actualDir,
                    });
                    run("git", ["config", "user.email", "user@example.com"], {
                        cwd: actualDir,
                    });
                    logs.push("      Create random file history");
                    makeRandomHistory(actualDir, submodule);

                    if (
                        "additionalFiles" in submodule &&
                        submodule.additionalFiles != null
                    ) {
                        for (const fileName of submodule.additionalFiles) {
                            logs.push("      Add extra file: " + fileName);
                            createFile(
                                actualDir,
                                fileName,
                                words(150 + Math.round(Math.random() * 100)),
                            );
                        }
                    }
                    if (
                        "additionalDirs" in submodule &&
                        submodule.additionalDirs != null
                    ) {
                        for (const dirName of submodule.additionalDirs) {
                            logs.push("      Add extra dir: " + dirName);
                            const subDir = resolve(actualDir, dirName);
                            mkdirSync(subDir);
                            makeRandomHistory(subDir, submodule);
                        }
                    }
                    if ("pullFrom" in submodule && submodule.pullFrom != null) {
                        for (const pullFrom of submodule.pullFrom) {
                            logs.push("      Pull from module: " + pullFrom);
                            const pullFromRemoteUrl = remotePath(pullFrom);
                            run(
                                "git",
                                [
                                    "remote",
                                    "add",
                                    `origin_${pullFrom}`,
                                    pullFromRemoteUrl,
                                ],
                                { cwd: actualDir },
                            );
                            run(
                                "git",
                                [
                                    "fetch",
                                    "--no-auto-maintenance",
                                    `origin_${pullFrom}`,
                                    "master",
                                ],
                                {
                                    cwd: actualDir,
                                },
                            );
                            run(
                                "git",
                                [
                                    "merge",
                                    "--allow-unrelated-histories",
                                    `origin_${pullFrom}/master`,
                                ],
                                { cwd: actualDir },
                            );
                        }
                    }

                    if (
                        "modifiers" in submodule &&
                        submodule.modifiers != null
                    ) {
                        for (const modifier of submodule.modifiers) {
                            logs.push("      Modifying: " + modifier.file);
                            writeFileSync(
                                resolve(actualDir, modifier.file),
                                modifier.content,
                                { encoding: "utf-8" },
                            );
                            gitAdd(modifier.file, actualDir);
                            gitCommit("Modified: " + modifier.file, actualDir);
                        }
                    }

                    if ("deletes" in submodule && submodule.deletes != null) {
                        for (const deleteFile of submodule.deletes) {
                            logs.push("      Delete " + deleteFile);
                            run("git", ["rm", deleteFile], { cwd: actualDir });
                            gitCommit("Deleted: " + deleteFile, actualDir);
                        }
                    }

                    logs.push("      Push to origin");
                    gitPush("origin", "master", actualDir, true);

                    return logs;
                })();
            }),
    );

    console.log(outputs.map((x) => x.join("\n")).join("\n"));

    console.log("  add submodule change to my-system");
    for (const submodule of submodules) {
        if (submodule.skipAddAsSubmodule === true) continue;
        console.log("   - " + submodule.name);
        gitAdd(
            submodule.renameFolder != null
                ? submodule.renameFolder
                : submodule.name,
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

if (module.id == ".") {
    createSubModules();
} else {
    module.exports.createSubModules = createSubModules;
    module.exports.mainRepoDir = mySystemDir;
}
