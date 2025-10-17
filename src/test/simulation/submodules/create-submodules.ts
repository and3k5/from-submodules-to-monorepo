import { platform } from "os";
import { run } from "../../../utils/process/run";
import { gitRemoteBase } from "../../globals";
import { gitAdd } from "../utils/git/git-add";
import { gitCommit } from "../utils/git/git-commit";
import { resolve } from "path";
import { makeRandomHistory } from "./methods";
import { createFile } from "../utils/fs/create-file";
import { words } from "../lorem";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { remotePath } from "../utils/git/remote-path";
import { gitPush } from "../utils/git/git-push";

function createHelper(remotes: string[], mySystemDir: string) {
    return {
        setUpUser(folderName: string) {
            const actualDir = resolve(mySystemDir, folderName);
            run("git", ["config", "user.name", "example user"], {
                cwd: actualDir,
            });
            run("git", ["config", "user.email", "user@example.com"], {
                cwd: actualDir,
            });
        },
        addSubmoduleToMainRepo(
            submoduleName: string,
            folderName: string | undefined,
        ) {
            console.log("       Add submodule");
            const remotePath = gitRemoteBase + "/" + submoduleName + ".git";
            run(
                "git",
                [
                    "submodule",
                    "add",
                    ...(folderName != null ? ["--name", folderName] : []),
                    remotePath,
                ],
                {
                    cwd: mySystemDir,
                    encoding: "utf-8",
                },
            );

            if (folderName != null) {
                if (
                    platform() == "win32" &&
                    folderName.toUpperCase() == submoduleName.toUpperCase()
                ) {
                    console.log("         Rename folder name (windows mode)");
                    // windows borks if we try to rename the folder to the same name but with same casing
                    run("git", ["mv", submoduleName, folderName + "-temp"], {
                        cwd: mySystemDir,
                    });
                    run("git", ["mv", folderName + "-temp", folderName], {
                        cwd: mySystemDir,
                    });
                } else {
                    console.log("         Rename folder name");
                    run("git", ["mv", submoduleName, folderName], {
                        cwd: mySystemDir,
                    });
                }
            }

            console.log("         Stage");
            gitAdd(
                folderName != null ? folderName : submoduleName,
                mySystemDir,
            );
            console.log("         Commit");
            gitCommit(
                "Added submodule: " +
                    submoduleName +
                    (folderName != null ? "as folder " + folderName : ""),
                mySystemDir,
            );
        },
        addAdditionalFile(folderName: string, fileName: string, force = false) {
            const actualDir = resolve(mySystemDir, folderName);
            console.log("       Create file: " + fileName);
            createFile(
                actualDir,
                fileName,
                words(150 + Math.round(Math.random() * 100)),
            );
            console.log("         Stage file");
            gitAdd(fileName, actualDir, force);
            console.log("         Commit file");
            gitCommit("Add extra file: " + fileName, actualDir);
        },
        addAdditionalDir(
            folderName: string,
            dirName: string,
            gitOptions: { force: boolean } | undefined,
        ) {
            const actualDir = resolve(mySystemDir, folderName);
            const subDir = resolve(actualDir, dirName);
            console.log("       Create dir: " + dirName);
            mkdirSync(subDir);
            console.log("         Make random history");
            makeRandomHistory(subDir, gitOptions, 2, 0, "           ");
        },
        ensureNotTracked(folderName: string, filename: string) {
            const actualDir = resolve(mySystemDir, folderName);
            console.log("       Ensure dir/file is not tracked:" + filename);
            try {
                run("git", ["ls-files", "--error-unmatch", filename], {
                    cwd: actualDir,
                });
            } catch (e) {
                if (e.status === 1) {
                    return true;
                }
                throw new Error("Unknown status code: " + e.status);
            }
            throw new Error(`File ${filename} is tracked in ${folderName}`);
        },
        pullRepo(folderName: string, pullFrom: string) {
            const actualDir = resolve(mySystemDir, folderName);
            const pullFromRemoteUrl = remotePath(pullFrom);
            console.log("       Pull from " + pullFrom);
            console.log(
                "         Add remote origin_" +
                    pullFrom +
                    " to pull from " +
                    pullFrom,
            );
            run(
                "git",
                ["remote", "add", `origin_${pullFrom}`, pullFromRemoteUrl],
                { cwd: actualDir },
            );
            console.log("         Fetch origin_" + pullFrom);
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
            console.log("         Merge origin_" + pullFrom);
            run(
                "git",
                [
                    "merge",
                    "--allow-unrelated-histories",
                    `origin_${pullFrom}/master`,
                ],
                { cwd: actualDir },
            );
        },
        modifyFile(
            folderName: string,
            filename: string,
            content: string,
            phrase = "Modify",
        ) {
            const actualDir = resolve(mySystemDir, folderName);
            console.log("       " + phrase + " " + filename);
            writeFileSync(resolve(actualDir, filename), content, {
                encoding: "utf-8",
            });
            console.log("         Stage");
            gitAdd(filename, actualDir);
            console.log("         Commit");
            gitCommit("Modified: " + filename, actualDir);
        },
        appendFile(folderName: string, filename: string, content: string) {
            const actualDir = resolve(mySystemDir, folderName);
            const newContent =
                readFileSync(resolve(actualDir, filename), {
                    encoding: "utf-8",
                }) + content;
            this.modifyFile(folderName, filename, newContent, "Append to");
        },
        deleteFile(folderName: string, filename: string) {
            const actualDir = resolve(mySystemDir, folderName);
            console.log("       Remove " + filename);
            run("git", ["rm", filename], { cwd: actualDir });
            console.log("         Commit");
            gitCommit("Deleted: " + filename, actualDir);
        },
        pushRepo(folderName: string) {
            const actualDir = resolve(mySystemDir, folderName);
            console.log("       Push origin master");
            gitPush("origin", "master", actualDir, true);
        },
    };
}

export function createSubmodules(remotes: string[], mySystemDir: string) {
    const submoduleFolderNames: string[] = [];
    const h = createHelper(remotes, mySystemDir);

    console.log("   - Webserver");
    h.addSubmoduleToMainRepo("Webserver", "webserver");
    h.setUpUser("webserver");
    h.addAdditionalDir("webserver", "bogus", { force: false });
    h.addAdditionalDir("webserver", "Webserver", { force: false });
    h.pullRepo("webserver", "commons");
    h.pushRepo("webserver");
    submoduleFolderNames.push("webserver");
    h.modifyFile("webserver", ".gitignore", "hocus_pocus");
    h.addAdditionalDir("webserver", "hocus_pocus", { force: true });
    h.addAdditionalDir("webserver", "node_modules", undefined);
    h.appendFile("webserver", "README-commons.md", "\nnode_modules");
    h.ensureNotTracked("webserver", "node_modules");

    console.log(" - Documentation");
    h.addSubmoduleToMainRepo("Documentation", "documentation");
    h.setUpUser("documentation");
    h.addAdditionalDir("documentation", "bogus", { force: false });
    h.addAdditionalFile("documentation", "Documentation");
    h.pushRepo("documentation");
    submoduleFolderNames.push("documentation");

    console.log(" - Commandline");
    h.addSubmoduleToMainRepo("Commandline", "commandline");
    h.setUpUser("commandline");
    h.addAdditionalDir("commandline", "bogus", { force: false });
    h.addAdditionalFile("commandline", "commandline");
    h.pullRepo("commandline", "commons");
    h.pushRepo("commandline");
    submoduleFolderNames.push("commandline");

    console.log(" - service");
    h.addSubmoduleToMainRepo("service", undefined);
    h.setUpUser("service");
    h.addAdditionalDir("service", "bogus", { force: false });
    h.pullRepo("service", "commons");
    h.modifyFile("service", "README-commons.md", "Foobar");
    h.pushRepo("service");
    submoduleFolderNames.push("service");

    console.log(" - surveillance");
    h.addSubmoduleToMainRepo("surveillance", undefined);
    h.setUpUser("surveillance");
    h.addAdditionalDir("surveillance", "bogus", { force: false });
    h.pullRepo("surveillance", "commons");
    h.pushRepo("surveillance");
    submoduleFolderNames.push("surveillance");

    console.log(" - worker");
    h.addSubmoduleToMainRepo("worker", undefined);
    h.setUpUser("worker");
    h.addAdditionalDir("worker", "bogus", { force: false });
    h.pullRepo("worker", "commons");
    h.modifyFile("worker", "README-commons.md", "Foobar2");
    h.pushRepo("worker");
    submoduleFolderNames.push("worker");

    console.log(" - data-and-stuff");
    h.addSubmoduleToMainRepo("data-and-stuff", "data");
    h.setUpUser("data");
    h.addAdditionalDir("data", "bogus", { force: false });
    h.addAdditionalFile("data", "DEMO.md");
    h.pullRepo("data", "commons");
    h.pushRepo("data");
    submoduleFolderNames.push("data");

    return submoduleFolderNames;
}
