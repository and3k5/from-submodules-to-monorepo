import { execFileSync } from "child_process";
import { ConsoleBase } from "../../utils/output/console-wrapper";
import { ensureLongPathsEnabled } from "../../utils/git/ensure-long-paths";
import { run } from "../../utils/process/run";

export function checkoutModule(
    fullPath: string,
    migrationBranchName: string,
    deleteExistingBranches: boolean,
    console: ConsoleBase,
) {
    // Enable long-path support in this submodule repo before touching its working tree
    // (checkout / clean / move), so deep .NET paths don't hit Windows MAX_PATH.
    ensureLongPathsEnabled(fullPath);

    if (deleteExistingBranches) {
        try {
            execFileSync("git", ["branch", "-D", migrationBranchName], {
                cwd: fullPath,
                stdio: "ignore",
            });
            console.log(
                "      Deleted existing branch: " + migrationBranchName,
            );
        } catch {
            // nothing
        }
    }
    run("git", ["checkout", "-b", migrationBranchName], { cwd: fullPath });
    console.log(`      Created branch: ${migrationBranchName}`);
}
