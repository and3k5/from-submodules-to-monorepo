import { execFileSync } from "child_process";
import { run } from "../../utils/process/run";
import { ConsoleBase } from "../../utils/output/console-wrapper";

export function checkoutModule(
    fullPath: string,
    migrationBranchName: string,
    deleteExistingBranches: boolean,
    console: ConsoleBase,
) {
    if (deleteExistingBranches) {
        console.log("Trying to delete existing branch: " + migrationBranchName);
        try {
            execFileSync("git", ["branch", "-D", migrationBranchName], {
                cwd: fullPath,
                stdio: "ignore",
            });
        } catch {
            // nothing
        }
    }
    run("git", ["checkout", "-b", migrationBranchName], { cwd: fullPath });
    console.log(`   Created branch: ${migrationBranchName}`);
}
