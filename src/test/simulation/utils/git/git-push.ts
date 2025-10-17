import { run } from "../../../../utils/process/run";

export function gitPush(remoteName, branchName, dir, setUpstream = false) {
    run(
        "git",
        ["push", ...(setUpstream ? ["-u"] : []), remoteName, branchName],
        {
            cwd: dir,
            encoding: "utf-8",
        },
    );
}
