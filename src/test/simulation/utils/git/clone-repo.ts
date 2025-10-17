import { resolve } from "path";
import { run } from "../../../../utils/process/run";
import { remotePath } from "./remote-path";

export function cloneRepo(reponame: string, dir: string) {
    if (reponame === null) throw new Error("reponame should not be null");
    if (reponame === undefined)
        throw new Error("reponame should not be undefined");
    if (dir === null) throw new Error("dir should not be null");
    if (dir === undefined) throw new Error("dir should not be undefined");
    const remoteUrl = remotePath(reponame);
    run("git", ["clone", remoteUrl], {
        cwd: dir,
        encoding: "utf-8",
    });
    return resolve(dir, reponame);
}
