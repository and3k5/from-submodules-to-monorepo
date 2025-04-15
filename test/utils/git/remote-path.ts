import { gitRemoteBase } from "../../globals";

export function remotePath(reponame : string) {
    const remotePath = gitRemoteBase + "/" + reponame + ".git";
    return remotePath;
}
