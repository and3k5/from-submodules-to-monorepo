import { cwd } from "process";
import { pullFlag } from "../utils/args/pull-flag";
import { pullValue } from "../utils/args/pull-value";
import { run } from "../utils/process/run";
import { relative } from "path";
import { existsSync } from "fs";
import { getRunOutput } from "../utils/process/get-run-output";

export async function autoResolveConflicts(
    repoDirectory: string,
    noCommit: boolean = false,
): Promise<boolean> {
    console.log("   Possible merge conflicts found:");
    const statusData = await getRunOutput("git", ["status", "--porcelain=v2"], {
        cwd: repoDirectory,
    });
    const statusLines = statusData
        .replace(/\r/g, "")
        .split("\n")
        .map((x) => x.trim())
        .filter((x) => x != "");
    if (statusLines.length == 0) {
        console.log("   None found");
        return false;
    }
    //console.log(statusLines);
    for (const statusLine of statusLines) {
        if (statusLine[0] != "u") {
            continue;
        }

        if (
            statusLine.substring(2, 4) === "UD" &&
            statusLine.substring(5, 9) === "N..."
        ) {
            const fileName = statusLine.split(" ").slice(10).join(" ");
            console.log(
                "   Adding file from modify/delete conflict: " + fileName,
            );
            run("git", ["add", fileName], { cwd: repoDirectory });
        } else {
            console.log("   Unknown state: " + statusLine);
            console.log(
                "   Line before: " +
                    statusLines[statusLines.indexOf(statusLine) - 1],
            );
            console.log(
                "   Line after: " +
                    statusLines[statusLines.indexOf(statusLine) + 1],
            );
        }
    }

    if (!noCommit) run("git", ["commit", "--no-edit"], { cwd: repoDirectory });
    return true;
}

function getCommandLine() {
    const nodeName = process.argv0;
    const relPath = relative(cwd(), process.argv[1]);
    return `${nodeName} ${relPath}`;
}

function showUsage() {
    console.log("Usage:");
    console.log(
        `${getCommandLine()} <repo-dir> [--no-commit] --acknowledge-risks-and-continue`,
    );
}

if (module.id == ".") {
    const argsLeftOver = process.argv.slice(2);
    const acknowledged = pullFlag(
        argsLeftOver,
        "--acknowledge-risks-and-continue",
    );
    const noCommit = pullFlag(argsLeftOver, "--no-commit");
    const mainRepoDir = pullValue(argsLeftOver);

    if (mainRepoDir == null) {
        console.error("Missing repo dir");
        showUsage();
        process.exit(1);
    }

    if (!existsSync(mainRepoDir)) {
        throw new Error(`The directory does not exist: ${mainRepoDir}`);
    }

    if (!acknowledged) {
        console.log("You must acknowledge the risks:");
        console.log("Use it at your own risk.");
        console.log(
            "This script is highly experimental and may cause irreversible damage, including but not limited to data loss, corruption of repositories, or deletion of your entire project. I will not be held responsible or liable for any damages, errors, or losses caused by using this solution. Always ensure you have proper backups before proceeding.",
        );
        console.log("Use --acknowledge-risks-and-continue and try again");
        process.exit(1);
    }

    if (typeof mainRepoDir != "string")
        throw new Error("A repo directory is required");
    autoResolveConflicts(mainRepoDir, noCommit);
}
