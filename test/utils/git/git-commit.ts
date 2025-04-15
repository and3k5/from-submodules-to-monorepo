import { run } from "../../../utils/process/run";

export function gitCommit(message, dir) {
    run("git", ["commit", "-m", message], {
        cwd: dir,
        encoding: "utf-8",
    });
}