import { execFileSync } from "child_process";
import { createSubModules } from "./create-submodules";
import { performTransformation } from "../../index";
import { readFileSync } from "fs";
import { pullFlag } from "../../utils/args/pull-flag";
import { diff } from "./diff-tree";
import { FileTreeItem } from "../../utils/files/file-tree";

function listRemotes(repoDir: string): string[] {
    try {
        return execFileSync("git", ["remote"], {
            cwd: repoDir,
            encoding: "utf-8",
        })
            .trim()
            .split("\n")
            .filter(Boolean);
    } catch {
        return [];
    }
}

export async function runSimulation() {
    try {
        const mainRepoDir = await createSubModules();

        const argsLeftOver = process.argv.slice(2);
        const skipTransformation = pullFlag(
            argsLeftOver,
            "--skip-transformation",
        );

        if (!skipTransformation) {
            const remotesBefore = new Set(listRemotes(mainRepoDir));
            let result: Awaited<ReturnType<typeof performTransformation>>;
            try {
                result = await performTransformation(mainRepoDir, {
                    migrationBranchName: "migrate-from-submodules-to-monorepo",
                    createReport: true,
                    keepUntrackedFiles: true,
                });
            } finally {
                const leakedRemotes = listRemotes(mainRepoDir).filter(
                    (r) => !remotesBefore.has(r),
                );
                if (leakedRemotes.length > 0) {
                    console.error(
                        `🔴 Remotes not cleaned up after transformation: ${leakedRemotes.join(", ")}`,
                    );
                    process.exit(1);
                }
            }

            //await createTreeFile(mainRepoDir, "tree-after.json", resolve(mainRepoDir, ".."));

            const beforeTree = readFileSync(result.treeBeforePath!, {
                encoding: "utf-8",
            });
            const afterTree = readFileSync(result.treeAfterPath!, {
                encoding: "utf-8",
            });
            const equal = beforeTree == afterTree;

            if (equal) {
                console.log("🟢 Tree remained equal!");
                console.log("Test passed! 👍");
            } else {
                console.error("Tree has differences:");
                const beforeJson = JSON.parse(beforeTree) as FileTreeItem;
                const afterJson = JSON.parse(afterTree) as FileTreeItem;
                diff(beforeJson, afterJson);
                console.error("🔴 Tree did not remain equal!");
                console.error("Test failed! 👎");
                process.exit(1);
            }
        }
    } catch (e) {
        console.log("Test failed!");
        console.log(e);
    }
}
