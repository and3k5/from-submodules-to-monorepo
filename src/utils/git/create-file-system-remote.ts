import { mkdirSync, existsSync } from "fs";
import { resolve } from "path";
import { run } from "../process/run";

export function createFileSystemRemote(
    remoteDir: string,
    repoName: string,
): string {
    const dirPath = resolve(remoteDir, repoName + ".git");
    if (existsSync(dirPath)) {
        return dirPath;
    }
    mkdirSync(dirPath);
    run("git", ["init", "--bare"], {
        cwd: dirPath,
        encoding: "utf-8",
    });
    run("git", ["symbolic-ref", "HEAD", "refs/heads/master"], {
        cwd: dirPath,
        encoding: "utf-8",
    });
    return dirPath;
}
