#!/usr/bin/env node
const { mkdirSync, existsSync, renameSync } = require("fs");
const { resolve, join, relative, parse } = require("path");
const { run } = require("./utils/process/run");
const { readGitmodules } = require("./utils/git/read-gitmodules");
const { cwd } = require("process");
const { pullFlag } = require("./utils/args/pull-flag");
const { pullValue } = require("./utils/args/pull-value");
const { sameDirName } = require("./utils/path/same-dir-name");
const {
    autoResolveConflicts,
} = require("./transformation/auto-resolve-conflicts");
const { runExec } = require("./utils/process/run-exec");

/**
 *
 * @param {string} mainRepoDir
 * @param {object} options
 * @param {string} options.migrationBranchName Branch name to create for the migration
 * @param {string?} options.resumeFromExistingBranch Resume in branch that already exists instead of creating new branch
 */
async function performTransformation(
    mainRepoDir,
    { migrationBranchName, resumeFromExistingBranch },
) {
    if (typeof mainRepoDir != "string")
        throw new Error("A repo directory is required");
    if (mainRepoDir == "") throw new Error("Must have valid path");
    if (typeof migrationBranchName != "string")
        throw new Error("Migration branch name is required");
    if (migrationBranchName == "")
        throw new Error("Must have valid branch name");

    console.log("Going to transform directory:");
    console.log(`   ${mainRepoDir}`);
    console.log(
        (resumeFromExistingBranch ? "Resuming from" : "Creating new") +
            " migration branch:",
    );
    console.log(`   ${migrationBranchName}`);

    run(
        "git",
        [
            "checkout",
            ...(resumeFromExistingBranch ? [] : ["-b"]),
            migrationBranchName,
        ],
        { cwd: mainRepoDir },
    );

    const submodules = readGitmodules(join(mainRepoDir, ".gitmodules"));

    console.log("Performing transformation:");

    for (const submodule of submodules) {
        const fullPath = resolve(mainRepoDir, submodule.path);
        const targetPath = join(fullPath, submodule.path);

        console.log(` - Submodule: ${submodule.path}`);
        console.log(
            `   Position: ${submodules.indexOf(submodule)}/${submodules.length - 1}`,
        );
        run("git", ["checkout", "-b", migrationBranchName], { cwd: fullPath });
        console.log(`   Created branch: ${migrationBranchName}`);

        console.log(
            `   Moving ${relative(mainRepoDir, fullPath)} to ${relative(mainRepoDir, targetPath)}`,
        );
        const targetPathExists = existsSync(targetPath);
        const tempNameForExistingPath = `${submodule.path}_TEMP_DUP`;
        if (targetPathExists) {
            renameSync(targetPath, join(fullPath, tempNameForExistingPath));
        }

        mkdirSync(targetPath, { recursive: true });

        const entries = run("git", ["ls-tree", "--name-only", "HEAD"], {
            encoding: "utf-8",
            cwd: fullPath,
        })
            .stdout.split("\n")
            .filter((e) => e != "");

        for (const entry of entries) {
            if (sameDirName(entry, submodule.path)) continue;
            run("git", ["mv", `${fullPath}/${entry}`, targetPath], {
                cwd: fullPath,
            });
        }

        if (targetPathExists) {
            renameSync(
                join(fullPath, tempNameForExistingPath),
                join(targetPath, submodule.path),
            );
        }

        console.log("   Adding moved files to commit");

        runExec("git", ["add", "."], { cwd: fullPath, stdio: "ignore" });
        runExec("git", ["commit", "-m", "Moving submodule files"], {
            cwd: fullPath,
            stdio: "ignore",
        });

        console.log("   Pushing to origin");

        runExec("git", ["push", "origin", migrationBranchName], {
            cwd: fullPath,
            stdio: "ignore",
        });

        console.log("   Removing submodule from main repo");

        runExec("git", ["rm", "-f", submodule.path], {
            cwd: mainRepoDir,
            stdio: "ignore",
        });

        console.log("   Committing submodule removal");

        runExec(
            "git",
            ["commit", "-m", `Remove submodule: ${submodule.path}`],
            {
                cwd: mainRepoDir,
            },
        );

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

    console.log("Transformation finished!");
}

function getCommandLine() {
    const nodeName = process.argv0;
    const relPath = relative(cwd(), process.argv[1]);
    if (parse(relPath).dir.replace(/\\/g, "/").split("/").length > 2) {
        return "npx from-submodules-to-monorepo";
    }
    return `${nodeName} ${relPath}`;
}

function showUsage() {
    console.log("Usage:");
    console.log(
        `${getCommandLine()} <repo-dir> <branch-name> --acknowledge-risks-and-continue`,
    );
}

if (module.id == ".") {
    const argsLeftOver = process.argv.slice(2);
    const acknowledged = pullFlag(
        argsLeftOver,
        "--acknowledge-risks-and-continue",
    );
    const resumeFromExistingBranch = pullFlag(
        argsLeftOver,
        "--resume-from-existing-branch",
    );
    const mainRepoDir = pullValue(argsLeftOver);

    if (mainRepoDir == null) {
        console.error("Missing repo dir");
        showUsage();
        return;
    }

    const migrationBranchName = pullValue(argsLeftOver);

    if (migrationBranchName == null) {
        console.error("Missing branch name");
        showUsage();
        return;
    }

    if (!existsSync(mainRepoDir)) {
        throw new Error(`The directory does not exist: ${mainRepoDir}`);
    }

    if (!acknowledged) {
        console.log("You must acknowledge the risks:");
        console.log("Use it at your own risk.");
        console.log(
            "This script is highly experimental and may cause irreversible damage, including but not limited to data loss, corruption of repositories, or deletion of your entire project. I will not be held responsible or liable for any damages, errors, or losses caused by using this solution. Always ensure you have proper backups before proceeding.",
        );
        console.log("Use --acknowledge-risks-and-continue and try again");
        process.exit(1);
    }

    if (typeof mainRepoDir != "string")
        throw new Error("A repo directory is required");
    if (typeof migrationBranchName != "string")
        throw new Error("Migration branch name is required");
    performTransformation(mainRepoDir, {
        migrationBranchName,
        resumeFromExistingBranch,
    });
} else {
    module.exports.performTransformation = performTransformation;
}
