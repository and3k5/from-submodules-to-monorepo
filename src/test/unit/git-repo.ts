// Shared helpers for unit tests that need a throwaway git repo. NOT a *.test.ts file, so vitest
// does not run it directly. Repos are created under the OS temp dir and cleaned via
// cleanupTempRepos() (call it in an afterEach). Repos are created at a named subdirectory so that
// `basename(dir)` is deterministic (several operations derive the target prefix from it).

import { execFileSync } from "child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { dirname, join } from "path";

export interface TempRepo {
    /** Parent temp dir (removed on cleanup). */
    parent: string;
    /** The repo working-tree dir; its basename === `name`. */
    dir: string;
    /** The repo directory basename. */
    name: string;
}

const createdParents: string[] = [];

/**
 * Run git in `dir`, returning stdout as a string. Optionally pipe `input` to stdin.
 * @param dir
 * @param args
 * @param input
 */
export function git(dir: string, args: string[], input?: Buffer): string {
    return execFileSync("git", args, {
        cwd: dir,
        encoding: "utf8",
        input,
    });
}

/**
 * Read a git config value, returning undefined when it is not set (git exits non-zero).
 * @param dir
 * @param key
 * @param scope
 */
export function gitConfigOrUndefined(
    dir: string,
    key: string,
    scope: "--local" | "--global" = "--local",
): string | undefined {
    try {
        return git(dir, ["config", scope, "--get", key]).trim();
    } catch {
        return undefined;
    }
}

/**
 * Create an initialized temp git repo with a deterministic basename and a test identity.
 * @param name
 */
export function makeTempGitRepo(name = "repo"): TempRepo {
    const parent = mkdtempSync(join(tmpdir(), "fstm-unit-"));
    createdParents.push(parent);
    const dir = join(parent, name);
    mkdirSync(dir);
    git(dir, ["init", "-q"]);
    git(dir, ["config", "user.email", "test@example.com"]);
    git(dir, ["config", "user.name", "Test User"]);
    git(dir, ["config", "core.autocrlf", "false"]);
    git(dir, ["config", "commit.gpgsign", "false"]);
    return { parent, dir, name };
}

/**
 * Write a file (creating parent dirs) inside the repo working tree.
 * @param dir
 * @param relPath
 * @param content
 */
export function writeFile(dir: string, relPath: string, content: string): void {
    const full = join(dir, relPath);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
}

/**
 * Stage everything and commit.
 * @param dir
 * @param message
 */
export function commitAll(dir: string, message = "commit"): void {
    git(dir, ["add", "-A"]);
    git(dir, ["commit", "-m", message]);
}

/**
 * Add an entry to the index at an explicit git mode via plumbing, without needing a real
 * working-tree file. Lets tests construct regular (100644), executable (100755), symlink
 * (120000) and gitlink (160000) entries cross-platform.
 * For 160000, pass a 40-hex commit sha as `content` (the object need not exist locally).
 * @param dir
 * @param mode
 * @param path
 * @param content
 */
export function addIndexEntry(
    dir: string,
    mode: "100644" | "100755" | "120000" | "160000",
    path: string,
    content: string,
): void {
    let sha = content;
    if (mode !== "160000") {
        sha = git(
            dir,
            ["hash-object", "-w", "--stdin"],
            Buffer.from(content),
        ).trim();
    }
    git(dir, [
        "update-index",
        "--add",
        "--cacheinfo",
        `${mode},${sha},${path}`,
    ]);
}

export interface TreeEntry {
    mode: string;
    type: string;
    sha: string;
    path: string;
}

/**
 * `git ls-tree -r <ref>` parsed into entries.
 * @param dir
 * @param ref
 */
export function lsTree(dir: string, ref = "HEAD"): TreeEntry[] {
    return git(dir, ["ls-tree", "-r", ref])
        .split("\n")
        .filter((l) => l.trim() !== "")
        .map((l) => {
            const [meta, path] = l.split("\t");
            const [mode, type, sha] = meta.split(/\s+/);
            return { mode, type, sha, path };
        });
}

export function currentBranch(dir: string): string {
    return git(dir, ["rev-parse", "--abbrev-ref", "HEAD"]).trim();
}

/** Remove all temp repos created so far. Call from afterEach. */
export function cleanupTempRepos(): void {
    for (const p of createdParents.splice(0)) {
        rmSync(p, { recursive: true, force: true });
    }
}
