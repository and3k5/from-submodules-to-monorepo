#!/usr/bin/env node
import { existsSync } from "fs";
import { relative, parse } from "path";
import { cwd } from "process";
import { performTransformation } from "./index";
import { prettyFormatCommandUsage } from "./utils/args/pretty-format-command-usage";
import { createConfig, getCommandValues } from "./utils/args/command-config";

function getCommandLine() {
    const nodeName = process.argv0;
    const relPath = relative(cwd(), process.argv[1]);
    if (parse(relPath).dir.replace(/\\/g, "/").split("/").length > 2) {
        return "npx from-submodules-to-monorepo";
    }
    return `${nodeName} ${relPath}`;
}

const defaultMigrationBranchName = "from-submodules-to-monorepo";

const argsConfig = createConfig({
    flags: {
        help: {
            identifier: "--help",
            description: "Show this help message.",
        },
        enableColors: {
            identifier: "--enable-colors",
            description: "Enable colors in the output.",
        },
        version: {
            identifier: "--version",
            description: "Show the version of this package.",
        },
        acknowledged: {
            identifier: "--acknowledge-risks-and-continue",
            description: "Acknowledge the risks",
            required: true,
        },
        resetWithMasterOrMainBranches: {
            identifier: "--reset-with-master-or-main-branches",
            description:
                "Reset the branches to master or main before running transformation.",
        },
        noThreads: {
            identifier: "--no-threads",
            description: "Don't run in parallel threads.",
            requiredRemarks:
                "Required if --pull-remotes is used without --nuke-remote.",
        },
        pullRemotes: {
            identifier: "--pull-remotes",
            description:
                "Pull remotes for all submodules and main repo.\nMust be used with either --no-threads or --nuke-remote.",
        },
        nukeRemote: {
            identifier: "--nuke-remote",
            description:
                "Safety switch to avoid pulling remotes uncontrollably.",
            requiredRemarks:
                "Required if --pull-remotes is used without --no-threads.",
        },
        deleteExistingBranches: {
            identifier: "--delete-existing-branches",
            description:
                "If any branch exist (<branch-name>) then delete them.",
        },
        createReport: {
            identifier: "--create-report",
            description:
                "Create a report with the transformation output and tree files to compare before and after.",
        },
        createTreeFiles: {
            identifier: "--create-tree-files",
            description:
                "Create tree files to compare before and after.\nOverwritten when using --create-report.",
        },
        keepUntrackedFiles: {
            identifier: "--keep-untracked-files",
            description:
                "Keep all untracked files after transformation.\nArchives will be stored in a temporary directory and then restored after the transformation.",
        },
    },
    values: {
        repoDir: {
            identifier: "repo-dir",
            description: "Path to the main repo directory.",
            required: true,
        },
        branchName: {
            identifier: "branch-name",
            description: "Name of the branch to create for the migration.",
            defaultValue: defaultMigrationBranchName,
        },
    },
});

const showUsage = function (enableColors: boolean) {
    console.log(
        prettyFormatCommandUsage(getCommandLine(), argsConfig, enableColors),
    );
};

const argValues = getCommandValues(argsConfig, process.argv.slice(2));
if (argValues == null) {
    console.error("Invalid args");
    showUsage(false);
    process.exit(1);
}
const flags = argValues.flags;
const values = argValues.values;
if (flags.help) {
    showUsage(flags.enableColors ?? false);
    process.exit(0);
}
if (flags.version) {
    console.log(
        "from-submodules-to-monorepo version: " + globalThis.__VERSION__,
    );
    process.exit(0);
}
const acknowledged = flags.acknowledged;
const resetWithMasterOrMainBranches = flags.resetWithMasterOrMainBranches;
const deleteExistingBranches = flags.deleteExistingBranches;
const createReport = flags.createReport;
const keepUntrackedFiles = flags.keepUntrackedFiles;
const createTreeFiles = flags.createTreeFiles;
const noThreads = flags.noThreads;
const pullRemotes = flags.pullRemotes;
const nukeRemote = flags.nukeRemote;
const mainRepoDir = values.repoDir;

if (mainRepoDir == null) {
    console.error("Missing repo dir");
    showUsage(flags.enableColors ?? false);
    process.exit(1);
}

let migrationBranchName = values.branchName;

if (migrationBranchName == null || migrationBranchName == "") {
    migrationBranchName = defaultMigrationBranchName;
}

if (!existsSync(mainRepoDir)) {
    throw new Error(`The directory does not exist: ${mainRepoDir}`);
}

if (pullRemotes) {
    if (!nukeRemote && !noThreads) {
        console.error("--pull-remotes requires --no-threads or --nuke-remote");
        showUsage(flags.enableColors ?? false);
        process.exit(1);
    }
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
if (typeof migrationBranchName != "string")
    throw new Error("Migration branch name is required");

performTransformation(mainRepoDir, {
    migrationBranchName,
    resetWithMasterOrMainBranches,
    deleteExistingBranches,
    noThreads,
    pullRemotes,
    nukeRemote,
    createReport,
    createTreeFiles,
    keepUntrackedFiles,
});
