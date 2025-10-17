import { run } from "../../../../utils/process/run";

export function gitAdd(file, dir, force = false) {
    run("git", ["add", file, ...(force ? ["-f"] : [])], {
        cwd: dir,
        encoding: "utf-8",
    });
}
