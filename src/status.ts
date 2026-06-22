#!/usr/bin/env node
import { existsSync, readFileSync } from "fs";
import { join, resolve } from "path";
import { spawnSync } from "child_process";

function git(cwd: string, args: string[]): string {
    const result = spawnSync("git", args, { cwd, encoding: "utf-8" });
    if (result.error != null) throw result.error;
    return (result.stdout ?? "").trim();
}

function gitSafe(cwd: string, args: string[]): string | null {
    try {
        return git(cwd, args);
    } catch {
        return null;
    }
}

interface SubmoduleInfo {
    path: string;
    branch: string | null;
    status: string;
}

function parseGitmodules(repoDir: string): string[] {
    const gitmodulesPath = join(repoDir, ".gitmodules");
    if (!existsSync(gitmodulesPath)) return [];
    const content = readFileSync(gitmodulesPath, "utf-8");
    const paths: string[] = [];
    for (const line of content.split("\n")) {
        const match = line.match(/^\s*path\s*=\s*(.+)$/);
        if (match) paths.push(match[1].trim());
    }
    return paths;
}

function getStatusSymbols(repoDir: string): string {
    const porcelain = gitSafe(repoDir, ["status", "--porcelain"]);
    if (porcelain == null) return "?";
    if (porcelain === "") return "clean";

    const lines = porcelain.split("\n").filter(Boolean);
    const symbols: string[] = [];

    let modified = false;
    let staged = false;
    let untracked = false;
    let conflicted = false;

    for (const line of lines) {
        const x = line[0];
        const y = line[1];
        if (
            x === "U" ||
            y === "U" ||
            (x === "A" && y === "A") ||
            (x === "D" && y === "D")
        ) {
            conflicted = true;
        } else if (x !== " " && x !== "?") {
            staged = true;
        }
        if (y === "M" || y === "D") modified = true;
        if (x === "?") untracked = true;
    }

    if (conflicted) symbols.push("conflict");
    if (staged) symbols.push("staged");
    if (modified) symbols.push("modified");
    if (untracked) symbols.push("untracked");

    return symbols.length > 0 ? symbols.join(", ") : "clean";
}

function getCurrentBranch(repoDir: string): string | null {
    const branch = gitSafe(repoDir, ["rev-parse", "--abbrev-ref", "HEAD"]);
    if (branch === "HEAD") {
        const sha = gitSafe(repoDir, ["rev-parse", "--short", "HEAD"]);
        return sha != null ? `(detached ${sha})` : null;
    }
    return branch;
}

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

function statusColor(status: string, useColors: boolean): string {
    if (!useColors) return status;
    if (status === "clean") return `${GREEN}${status}${RESET}`;
    if (status.includes("conflict")) return `${RED}${status}${RESET}`;
    if (status.includes("staged")) return `${CYAN}${status}${RESET}`;
    if (status.includes("modified")) return `${YELLOW}${status}${RESET}`;
    return `${GRAY}${status}${RESET}`;
}

(async () => {
    const useColors = colorsSupported();
    const arg = process.argv[2];
    const repoDir = arg != null ? resolve(arg) : process.cwd();

    if (!existsSync(repoDir)) {
        console.error(`Directory does not exist: ${repoDir}`);
        process.exit(1);
    }

    const mainBranch = getCurrentBranch(repoDir);
    const mainStatus = getStatusSymbols(repoDir);
    const submodulePaths = parseGitmodules(repoDir);

    const repoName = repoDir.split("/").pop() ?? repoDir;
    const branchStr =
        mainBranch != null
            ? colorize(mainBranch, BOLD + CYAN, useColors)
            : colorize("unknown", DIM, useColors);

    console.log(
        `${colorize(repoName, BOLD, useColors)} ${colorize("[", DIM, useColors)}${branchStr}${colorize("]", DIM, useColors)} ${statusColor(mainStatus, useColors)}`,
    );

    const submodules: SubmoduleInfo[] = submodulePaths.map((subPath) => {
        const fullPath = join(repoDir, subPath);
        const branch = getCurrentBranch(fullPath);
        const status = existsSync(fullPath)
            ? getStatusSymbols(fullPath)
            : "missing";
        return { path: subPath, branch, status };
    });

    for (let i = 0; i < submodules.length; i++) {
        const sub = submodules[i];
        const isLast = i === submodules.length - 1;
        const connector = isLast ? "└── " : "├── ";
        const branchPart =
            sub.branch != null
                ? colorize(sub.branch, CYAN, useColors)
                : colorize("unknown", DIM, useColors);

        console.log(
            `${colorize(connector, DIM, useColors)}${colorize(sub.path, BOLD, useColors)} ${colorize("[", DIM, useColors)}${branchPart}${colorize("]", DIM, useColors)} ${statusColor(sub.status, useColors)}`,
        );
    }

    if (submodules.length === 0) {
        console.log(colorize("  (no submodules found)", DIM, useColors));
    }
})();
