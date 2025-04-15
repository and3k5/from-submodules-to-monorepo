import { cwd } from "process";
import { readGitmodules } from "../../utils/git/read-gitmodules";
import { resolve, relative, join } from "path";
import { existsSync } from "fs";
import { isMainThread, Worker } from "worker_threads";
import { ConsoleBase } from "../../utils/output/console-wrapper";
import { prettyFormatCommandUsage } from "../../utils/args/pretty-format-command-usage";
import { cpus } from "os";
import { URL as NodeURL } from "url";
import { execFileSync } from "child_process";
import {
    createConfig,
    getCommandValues,
} from "../../utils/args/command-config";
import { checkoutBranch, CheckoutBranchesOptions } from "./common";

const cpuThreadCount = cpus().length;

async function runSubmoduleUpdatesAndCheckout(
    path: string,
    branchNames: string | string[],
    options: CheckoutBranchesOptions,
): Promise<string[]> {
    const gitModulesPath = join(path, ".gitmodules");
    if (!existsSync(gitModulesPath)) {
        return [];
    }
    execFileSync(
        "git",
        [
            "submodule",
            "update",
            "--jobs",
            cpuThreadCount.toString(),
            ...(options.pullRemotes === true ? ["--remote"] : []),
        ],
        { cwd: path, stdio: "ignore" },
    );

    const subModuleTasks: ReturnType<typeof checkoutBranches>[] = [];
    for (const gitmodule of readGitmodules(gitModulesPath)) {
        if (gitmodule.path == null) continue;
        const moduleName = gitmodule.path;
        const modulePath = resolve(path, moduleName);
        const task = checkoutBranches(
            modulePath,
            branchNames,
            options,
            console,
            true,
        );
        if (options.noThreads === true) {
            await task;
        }
        subModuleTasks.push(task);
    }
    return (await Promise.all(subModuleTasks)).flatMap((x) => x);
}

const checkoutBranchThread: (
    ...args: Parameters<typeof checkoutBranch>
) => Promise<string[]> = (path, branchNames, options, isSubmodule) => {
    return new Promise((resolve, reject) => {
        const worker = new Worker(
            /* webpackChunkName: "worker-checkout-branches" */
            new URL("./thread-worker.ts", import.meta.url) as NodeURL,
            {
                workerData: {
                    path,
                    branchNames,
                    pullRemotes: options.pullRemotes,
                    isSubmodule: isSubmodule,
                },
            },
        );

        worker.on("message", resolve);
        worker.on("error", (reason) => {
            reject(reason);
        });
        worker.on("exit", (code) => {
            if (code !== 0) {
                reject(new Error(`Worker stopped with exit code: ${code}`));
            }
        });
    });
};

export async function checkoutBranches(
    path: string,
    branchNames: string[] | string,
    options: CheckoutBranchesOptions,
    console: ConsoleBase,
    isSubmodule?: boolean | undefined,
): Promise<string[]> {
    console.log("Run queue for " + path);

    let checkoutBranchResult: string[];
    if (options.noThreads !== true)
        checkoutBranchResult = await checkoutBranchThread(
            path,
            branchNames,
            options,
            console,
            isSubmodule === true,
        );
    else {
        await checkoutBranch(
            path,
            branchNames,
            options,
            console,
            isSubmodule === true,
        );
        checkoutBranchResult =
            "contents" in console && Array.isArray(console.contents)
                ? console.contents
                : [];
    }

    const { noSubmoduleUpdate } = options;
    if (noSubmoduleUpdate) return checkoutBranchResult;

    const otherBranchResult = await runSubmoduleUpdatesAndCheckout(
        path,
        branchNames,
        options,
    );
    const lines = [checkoutBranchResult, otherBranchResult].flatMap((x) => x);
    return lines;
}

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

if (!isMainThread) {
    throw new Error("Should not be used in worker thread");
} else if (module.id == ".") {
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
