import { run } from "../process/run";

export function getBranches(dir: string): string[] {
    const result = run("git", ["--no-pager", "branch", "--format=%(refname)"], {
        encoding: "utf-8",
        cwd: dir,
    });
    return (result.stdout! as string)
        .trim()
        .split("\n")
        .map((x) => x.trim())
        .filter((x) => x.length > 0);
}
