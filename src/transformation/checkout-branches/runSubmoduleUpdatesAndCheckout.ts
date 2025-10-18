import { execFileSync } from "child_process";
import { existsSync } from "fs";
import { join, resolve } from "path/posix";
import { cpuThreadCount } from ".";
import { checkoutBranches } from "./checkoutBranches";
import { readGitmodules } from "../../utils/git/read-gitmodules";
import { CheckoutBranchesOptions } from "./common";

export async function runSubmoduleUpdatesAndCheckout(
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
