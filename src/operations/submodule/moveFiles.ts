import { execFileSync } from "child_process";
import { basename } from "path";
import { Submodule } from "../../utils/git/read-gitmodules";
import { ConsoleBase } from "../../utils/output/console-wrapper";
import { ensureSameCaseForPath } from "../../utils/path/ensure-same-case-for-path";
import { run } from "../../utils/process/run";

export function moveFiles(
    mainRepoDir: string,
    fullPath: string,
    submodule: Submodule,
    console: ConsoleBase,
) {
    fullPath = ensureSameCaseForPath(fullPath);
    const correctCasedSubmodulePath = basename(fullPath);

    console.log(
        `      Moving contents into ${correctCasedSubmodulePath}/ (index rewrite)`,
    );

    // Relocate every tracked entry under a subdirectory named after the submodule by
    // rewriting the index from HEAD's tree, instead of moving files in the working tree.
    //
    // This is done with plumbing (read-tree) rather than `git mv` because `git mv` operates
    // on the working tree and fails on several perfectly valid tree shapes — notably
    // symlinks that point at a directory (git follows them and errors "is in index and no
    // submodule"), and tracked files that are absent from the working tree (skip-worktree /
    // assume-unchanged → "bad source"). read-tree works purely on tree objects, so it
    // preserves every mode (regular, executable 100755, symlink 120000, gitlink 160000) and
    // is oblivious to the state of the working tree. It also subsumes the old "target dir
    // already exists" (_TEMP_DUP) handling: an existing top-level `<name>` entry simply
    // becomes `<name>/<name>` in the freshly-built tree, with no collision.
    run("git", ["read-tree", "--empty"], { cwd: fullPath });
    run(
        "git",
        ["read-tree", `--prefix=${correctCasedSubmodulePath}/`, "HEAD"],
        { cwd: fullPath },
    );

    console.log("         Commit");

    // Commits the rewritten index (parent = current HEAD, i.e. the migration branch tip).
    // The working tree is intentionally left untouched/stale — only the committed tree is
    // pushed and merged into the main repo, so the submodule working tree no longer matters.
    //
    // Uses execFileSync with stdio "ignore" rather than run(): a whole-tree relocation makes
    // `git commit` print a per-file summary of every moved path, which overflows the captured
    // output buffer (spawnSync ENOBUFS) on large submodules. We don't need the output.
    execFileSync("git", ["commit", "-m", "Moving submodule files"], {
        cwd: fullPath,
        stdio: "ignore",
    });
}
