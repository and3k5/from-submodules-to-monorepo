import { cwd } from "process";
import { relative } from "path";
import { existsSync } from "fs";
import { prettyFormatCommandUsage } from "../../utils/args/pretty-format-command-usage";
import { cpus } from "os";
import {
    createConfig,
    getCommandValues,
} from "../../utils/args/command-config";
import { checkoutBranches } from "./checkoutBranches";

export const cpuThreadCount = cpus().length;

function getCommandLine() {
    const nodeName = process.argv0;
    const relPath = relative(cwd(), process.argv[1]);
    return `${nodeName} ${relPath}`;
}

const argsConfig = createConfig({
    flags: {
        acknowledged: {
            identifier: "--acknowledge-risks-and-continue",
            description: "Acknowledge the risks",
            required: true,
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
        noSubmoduleUpdate: {
            identifier: "--no-submodule-update",
            description: "Dont update submodules",
        },
    },
    values: {
        repoDir: {
            identifier: "repo-dir",
            description: "Path to the main repo directory.",
            required: true,
        },
        branchName: {
            identifier: "branchname",
            description:
                "Name(s) of the branch to create for the migration.\nIf multiple branches (like main and master), separate by comma and no spaces",
            customNotation: "multiple-values-comma-separated",
        },
    },
});

if (import.meta.main) {
    const showUsage = function () {
        console.log(prettyFormatCommandUsage(getCommandLine(), argsConfig));
    };

    const argValues = getCommandValues(argsConfig, process.argv.slice(2));
    if (argValues == null) {
        console.error("Invalid args");
        showUsage();
        process.exit(1);
    }
    const flags = argValues.flags;
    const values = argValues.values;
    if (flags.help) {
        showUsage();
        process.exit(0);
    }

    const acknowledged = flags.acknowledged;
    const noSubmoduleUpdate = flags.noSubmoduleUpdate;
    const pullRemotes = flags.pullRemotes;
    const nukeRemote = flags.nukeRemote;
    const noThreads = flags.noThreads;
    const repoDir = values.repoDir;
    const branchNames = values.branchName?.split(",");

    if (repoDir == null) {
        console.error("Missing repo dir");
        showUsage();
        process.exit(1);
    }

    if (!existsSync(repoDir)) {
        throw new Error(`The directory does not exist: ${repoDir}`);
    }

    if (pullRemotes) {
        if (!nukeRemote && !noThreads) {
            console.error(
                "--pull-remotes requires --no-threads or --nuke-remote",
            );
            showUsage();
            process.exit(1);
        }
    }

    if (branchNames == null || branchNames.length == 0) {
        console.error("Missing branch names");
        showUsage();
        process.exit(1);
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

    if (typeof repoDir != "string")
        throw new Error("A repo directory is required");
    const promise = checkoutBranches(
        repoDir,
        branchNames,
        {
            noSubmoduleUpdate: noSubmoduleUpdate,
            pullRemotes: pullRemotes,
            noThreads: noThreads,
        },
        console,
    );
    promise.then((lines) => {
        for (const line of lines) {
            console.log(line);
        }
    });
}
