#!/usr/bin/env node
import { existsSync, readdirSync, statSync, rmSync } from "fs";
import { resolve, join, sep } from "path";
import { execFileSync } from "child_process";
import { createInterface } from "readline";
// Both of these mkdirSync their directory if missing. That benign side effect
// (cleanup may create an empty data dir / remotes dir) is acceptable here and
// keeps path resolution identical to what the transformation itself uses.
import { getDataDir } from "./utils/storage/get-data-dir";
import { getRemotePath } from "./utils/storage/get-temp-remote-path";
import { readGitmodules } from "./utils/git/read-gitmodules";

function colorsSupported(): boolean {
    if (process.env.NO_COLOR !== undefined) return false;
    if (process.env.FORCE_COLOR !== undefined) return true;
    return process.stdout.isTTY === true;
}

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RED = "\x1b[31m";
const GRAY = "\x1b[90m";

function colorize(text: string, color: string, useColors: boolean): string {
    return useColors ? `${color}${text}${RESET}` : text;
}

function formatBytes(n: number): string {
    const units = ["B", "KB", "MB", "GB", "TB"];
    let value = n;
    let i = 0;
    while (value >= 1024 && i < units.length - 1) {
        value /= 1024;
        i++;
    }
    return `${i === 0 ? value : value.toFixed(1)} ${units[i]}`;
}

/** Recursively sum file sizes; skip entries that vanish or can't be stat'd. */
function dirSize(path: string): number {
    let total = 0;
    let entries;
    try {
        entries = readdirSync(path, { withFileTypes: true });
    } catch {
        return total;
    }
    for (const entry of entries) {
        const full = join(path, entry.name);
        try {
            if (entry.isDirectory()) {
                total += dirSize(full);
            } else {
                total += statSync(full).size;
            }
        } catch {
            // entry vanished or is locked; ignore it
        }
    }
    return total;
}

type Scope = "data-remote" | "data-archive" | "report" | "git-remote";

interface Target {
    scope: Scope;
    label: string;
    /** Byte size for filesystem targets; undefined for git-config remotes. */
    size?: number;
    remove: () => void;
}

/**
 * Guarantee `target` sits inside `root`. Called immediately before every
 * filesystem deletion so it is structurally impossible to delete outside the
 * intended root even if enumeration is later changed.
 */
function assertWithin(root: string, target: string): void {
    const resolvedRoot = resolve(root);
    const resolvedTarget = resolve(target);
    if (
        resolvedTarget !== resolvedRoot &&
        !resolvedTarget.startsWith(resolvedRoot + sep)
    ) {
        throw new Error(
            `Refusing to delete a path outside ${resolvedRoot}: ${resolvedTarget}`,
        );
    }
}

/** Generated bare file-system remotes: <dataDir>/remotes/<name>.git/ */
function enumerateDataRemotes(): Target[] {
    const dataDir = getDataDir();
    const remotesDir = getRemotePath();
    const targets: Target[] = [];
    let entries;
    try {
        entries = readdirSync(remotesDir, { withFileTypes: true });
    } catch {
        return targets;
    }
    for (const entry of entries) {
        if (entry.isDirectory() && entry.name.endsWith(".git")) {
            const full = join(remotesDir, entry.name);
            targets.push({
                scope: "data-remote",
                label: `remotes/${entry.name}`,
                size: dirSize(full),
                remove: () => {
                    assertWithin(dataDir, full);
                    rmSync(full, { recursive: true, force: true });
                },
            });
        }
    }
    return targets;
}

/**
 * Untracked-file archive dirs directly under the data dir. Their names are
 * exactly 10 uppercase letters (see createTempDir's makeTempName). The strict
 * regex is the safety linchpin: we never touch a stray user dir.
 */
function enumerateDataArchives(): Target[] {
    const dataDir = getDataDir();
    const targets: Target[] = [];
    let entries;
    try {
        entries = readdirSync(dataDir, { withFileTypes: true });
    } catch {
        return targets;
    }
    for (const entry of entries) {
        if (entry.isDirectory() && /^[A-Z]{10}$/.test(entry.name)) {
            const full = join(dataDir, entry.name);
            targets.push({
                scope: "data-archive",
                label: entry.name,
                size: dirSize(full),
                remove: () => {
                    assertWithin(dataDir, full);
                    rmSync(full, { recursive: true, force: true });
                },
            });
        }
    }
    return targets;
}

/** report<epochMillis>/ dirs that sit as direct siblings of the given repo. */
function enumerateReports(repoDir: string): Target[] {
    const parent = resolve(repoDir, "..");
    const targets: Target[] = [];
    let entries;
    try {
        entries = readdirSync(parent, { withFileTypes: true });
    } catch {
        return targets;
    }
    for (const entry of entries) {
        if (entry.isDirectory() && /^report\d+$/.test(entry.name)) {
            const full = join(parent, entry.name);
            targets.push({
                scope: "report",
                label: full,
                size: dirSize(full),
                remove: () => {
                    assertWithin(parent, full);
                    rmSync(full, { recursive: true, force: true });
                },
            });
        }
    }
    return targets;
}

function listRemotes(cwd: string): string[] {
    try {
        return execFileSync("git", ["remote"], { cwd, encoding: "utf-8" })
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);
    } catch {
        return [];
    }
}

function removeRemote(cwd: string, name: string): void {
    execFileSync("git", ["remote", "remove", name], { cwd, stdio: "ignore" });
}

/**
 * Leftover git remote config entries a crashed run may have left behind:
 * `origin_*` in the main repo (pullSubmoduleToMainRepo) and `local_origin` in
 * each submodule working dir (pushToOrigin). Only names that currently exist
 * are reported.
 */
function enumerateGitRemotes(repoDir: string): Target[] {
    const targets: Target[] = [];

    for (const name of listRemotes(repoDir)) {
        if (name.startsWith("origin_")) {
            targets.push({
                scope: "git-remote",
                label: `remote '${name}' in ${repoDir}`,
                remove: () => removeRemote(repoDir, name),
            });
        }
    }

    const gitmodulesPath = join(repoDir, ".gitmodules");
    if (existsSync(gitmodulesPath)) {
        let submodules: ReturnType<typeof readGitmodules> = [];
        try {
            submodules = readGitmodules(gitmodulesPath);
        } catch {
            submodules = [];
        }
        for (const submodule of submodules) {
            if (submodule.path == null) continue;
            const subDir = resolve(repoDir, submodule.path);
            if (!existsSync(subDir)) continue;
            for (const name of listRemotes(subDir)) {
                if (name === "local_origin") {
                    targets.push({
                        scope: "git-remote",
                        label: `remote 'local_origin' in ${submodule.path}`,
                        remove: () => removeRemote(subDir, name),
                    });
                }
            }
        }
    }

    return targets;
}

function usage(): string {
    return `Usage: node dist/cleanup.js [repo-dir] [options]

Removes temporary data generated by from-submodules-to-monorepo.

Scopes:
  data (default)   tool data dir (~/.from-submodules-to-monorepo/):
                     remotes/*.git             generated file-system remotes
                     <10 uppercase letters>/   untracked-file archive dirs
  reports          report<timestamp>/ dirs beside repo-dir   (requires repo-dir)
  remotes          leftover 'origin_*' / 'local_origin' git remote entries
                   in repo-dir and its submodules            (requires repo-dir)

Options:
  --reports          include the reports scope     (requires repo-dir)
  --remotes          include the git-remotes scope (requires repo-dir)
  --all              include every scope applicable to the given args
  -i, --interactive  choose scopes one by one (prompts per scope)
  --dry-run          list what would be removed; delete nothing (overrides --yes)
  -y, --yes          delete without the confirmation prompt
  -h, --help         show this help

It never deletes anything outside the tool's data dir, except the opt-in
reports/remotes scopes, which are bounded to the repo-dir you pass.`;
}

function ask(question: string): Promise<string> {
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((res) => {
        rl.question(question, (answer) => {
            rl.close();
            res(answer.trim());
        });
    });
}

async function askYesNo(question: string): Promise<boolean> {
    const answer = await ask(question);
    return /^y(es)?$/i.test(answer);
}

function scopeTag(scope: Scope, useColors: boolean): string {
    switch (scope) {
        case "data-remote":
            return colorize("[remote] ", CYAN, useColors);
        case "data-archive":
            return colorize("[archive]", YELLOW, useColors);
        case "report":
            return colorize("[report] ", GRAY, useColors);
        case "git-remote":
            return colorize("[git]    ", RED, useColors);
    }
}

(async () => {
    const useColors = colorsSupported();

    const argv = process.argv.slice(2);
    let repoDir: string | null = null;
    let help = false;
    let dryRun = false;
    let yes = false;
    let interactive = false;
    let wantReports = false;
    let wantRemotes = false;
    let wantAll = false;
    const unknown: string[] = [];

    for (const arg of argv) {
        switch (arg) {
            case "-h":
            case "--help":
                help = true;
                break;
            case "--dry-run":
                dryRun = true;
                break;
            case "-y":
            case "--yes":
                yes = true;
                break;
            case "-i":
            case "--interactive":
                interactive = true;
                break;
            case "--reports":
                wantReports = true;
                break;
            case "--remotes":
                wantRemotes = true;
                break;
            case "--all":
                wantAll = true;
                break;
            default:
                if (arg.startsWith("-")) {
                    unknown.push(arg);
                } else if (repoDir == null) {
                    repoDir = resolve(arg);
                } else {
                    unknown.push(arg);
                }
        }
    }

    if (help) {
        console.log(usage());
        process.exit(0);
    }

    if (unknown.length > 0) {
        console.error(`Unrecognized argument(s): ${unknown.join(", ")}`);
        console.error(usage());
        process.exit(1);
    }

    if (repoDir != null && !existsSync(repoDir)) {
        console.error(`Directory does not exist: ${repoDir}`);
        process.exit(1);
    }

    const reportsAndRemotesNeedRepo =
        (wantReports || wantRemotes) && repoDir == null;
    if (reportsAndRemotesNeedRepo) {
        console.error(
            "--reports and --remotes require a repo-dir argument. See --help.",
        );
        process.exit(1);
    }

    const canReports = repoDir != null;
    const canRemotes = repoDir != null;

    // Determine which scopes to act on.
    const scopes = {
        data: false,
        reports: false,
        remotes: false,
    };

    if (interactive) {
        if (process.stdin.isTTY !== true) {
            console.error(
                "--interactive requires an interactive terminal (TTY).",
            );
            process.exit(1);
        }
        console.log("Choose which scopes to clean:");
        scopes.data = await askYesNo(
            `  data — tool data dir (${getDataDir()})? (y/N) `,
        );
        if (canReports) {
            scopes.reports = await askYesNo(
                "  reports — report<timestamp>/ dirs beside the repo? (y/N) ",
            );
        }
        if (canRemotes) {
            scopes.remotes = await askYesNo(
                "  remotes — leftover git remote entries in the repo? (y/N) ",
            );
        }
    } else {
        // Default baseline is the data scope; flags add the opt-in scopes.
        scopes.data = true;
        if (wantAll) {
            scopes.reports = canReports;
            scopes.remotes = canRemotes;
        }
        if (wantReports) scopes.reports = true;
        if (wantRemotes) scopes.remotes = true;
    }

    // Enumerate targets for the selected scopes.
    const targets: Target[] = [];
    if (scopes.data) {
        targets.push(...enumerateDataRemotes());
        targets.push(...enumerateDataArchives());
    }
    if (scopes.reports && repoDir != null) {
        targets.push(...enumerateReports(repoDir));
    }
    if (scopes.remotes && repoDir != null) {
        targets.push(...enumerateGitRemotes(repoDir));
    }

    console.log(
        colorize("from-submodules-to-monorepo cleanup", BOLD, useColors),
    );
    if ("__VERSION__" in globalThis) {
        console.log("   version: " + globalThis.__VERSION__);
    }
    console.log(colorize(`Data dir: ${getDataDir()}`, DIM, useColors));
    if (repoDir != null) {
        console.log(colorize(`Repo dir: ${repoDir}`, DIM, useColors));
    }
    console.log("");

    if (targets.length === 0) {
        console.log(colorize("Nothing to clean.", GREEN, useColors));
        process.exit(0);
    }

    let totalBytes = 0;
    for (const target of targets) {
        const sizeStr = target.size != null ? formatBytes(target.size) : "-";
        if (target.size != null) totalBytes += target.size;
        console.log(
            `  ${scopeTag(target.scope, useColors)}  ` +
                `${colorize(sizeStr.padStart(9), DIM, useColors)}  ` +
                `${target.label}`,
        );
    }
    console.log("");
    console.log(
        `${colorize(String(targets.length), BOLD, useColors)} item(s), ` +
            `${colorize(formatBytes(totalBytes), BOLD, useColors)} total`,
    );

    if (dryRun) {
        if (yes) {
            console.log(
                colorize(
                    "Note: --dry-run overrides --yes; nothing will be deleted.",
                    YELLOW,
                    useColors,
                ),
            );
        }
        console.log("");
        console.log(
            colorize(
                "Dry run — nothing removed. Re-run with --yes to delete.",
                CYAN,
                useColors,
            ),
        );
        process.exit(0);
    }

    if (!yes) {
        if (process.stdin.isTTY !== true) {
            console.error("");
            console.error(
                "Not an interactive terminal. Pass --yes to delete or --dry-run to preview.",
            );
            process.exit(1);
        }
        console.log("");
        const confirmed = await askYesNo(
            `Delete these ${targets.length} item(s)? (y/N) `,
        );
        if (!confirmed) {
            console.log("Aborted. Nothing was removed.");
            process.exit(0);
        }
    }

    let removed = 0;
    let removedBytes = 0;
    let failed = 0;
    for (const target of targets) {
        try {
            target.remove();
            removed++;
            if (target.size != null) removedBytes += target.size;
        } catch (error) {
            failed++;
            console.error(`Failed to remove ${target.label}: ${error}`);
        }
    }

    console.log("");
    console.log(
        colorize(
            `Removed ${removed} item(s), freed ${formatBytes(removedBytes)}.`,
            GREEN,
            useColors,
        ),
    );
    if (failed > 0) {
        console.error(
            colorize(`${failed} item(s) could not be removed.`, RED, useColors),
        );
        process.exit(1);
    }
    process.exit(0);
})();
