import { getMatchingBranch } from "../../utils/git/get-matching-branch";
import {
    ConsoleBase,
} from "../../utils/output/console-wrapper";
import { whileIndexLock } from "../../utils/git/while-index-lock";
import { execFileSync } from "child_process";

export async function checkoutBranch(
    path: string,
    branchNames: string | string[],
    options: CheckoutBranchesOptions,
    console: ConsoleBase,
    isSubmodule: boolean,
): Promise<void> {
    if (typeof branchNames === "string") {
        branchNames = [branchNames];
    }
    const matchingBranchName = getMatchingBranch(path, branchNames);
    if (matchingBranchName == null)
        throw new Error(
            "Has no matching branch names for any of the branches: " +
                branchNames.join(", "),
        );

    await whileIndexLock(path);
    console.log("Restore: " + path);
    console.log("  Restore staged files");
    execFileSync("git", ["restore", "--staged", "."], {
        cwd: path,
        stdio: "ignore",
    });
    console.log("  Restore unstaged files");
    execFileSync("git", ["restore", "."], { cwd: path, stdio: "ignore" });
    console.log("  Delete untracked files");
    execFileSync("git", ["clean", "-f"], { cwd: path, stdio: "ignore" });
    console.log("  Delete untracked dirs");
    execFileSync("git", ["clean", "-fd"], { cwd: path, stdio: "ignore" });
    console.log("  Delete untracked + excluded dirs");
    execFileSync("git", ["clean", "-fdx"], { cwd: path, stdio: "ignore" });
    console.log("  Check out branch: " + matchingBranchName);
    execFileSync("git", ["checkout", matchingBranchName], {
        cwd: path,
        stdio: "ignore",
    });
    console.log("  Restore staged files");
    execFileSync("git", ["restore", "--staged", "."], {
        cwd: path,
        stdio: "ignore",
    });
    console.log("  Restore unstaged files");
    execFileSync("git", ["restore", "."], { cwd: path, stdio: "ignore" });
    console.log("  Delete untracked files");
    execFileSync("git", ["clean", "-f"], { cwd: path, stdio: "ignore" });
    console.log("  Delete untracked dirs");
    execFileSync("git", ["clean", "-fd"], { cwd: path, stdio: "ignore" });
    console.log("  Delete untracked + excluded dirs");
    execFileSync("git", ["clean", "-fdx"], { cwd: path, stdio: "ignore" });
    if (options.pullRemotes === true) {
        if (isSubmodule) {
            console.log("  Merging changes from remote");
            execFileSync("git", ["fetch", "--no-auto-maintenance"], {
                cwd: path,
                stdio: "ignore",
            });
        }
        console.log("  Merging changes from remote");
        execFileSync("git", ["merge", "--ff-only"], {
            cwd: path,
            encoding: "utf-8",
        });
    }
}
export interface CheckoutBranchesOptions {
    noSubmoduleUpdate?: boolean | undefined | null;
    noThreads?: boolean | undefined | null;
    pullRemotes?: boolean | undefined | null;
    nukeRemote?: boolean | undefined | null;
}
