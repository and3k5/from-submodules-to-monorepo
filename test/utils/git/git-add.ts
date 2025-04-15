import { run } from "../../../utils/process/run";

export function gitAdd(file, dir) {
    run("git", ["add", file], {
        cwd: dir,
        encoding: "utf-8",
    });
}
