import { createSubModules } from "./create-submodules";
import { performTransformation } from "../perform-transformation";
import { readFileSync } from "fs";
import { pullFlag } from "../utils/args/pull-flag";

(async function () {
    try {
        const mainRepoDir = await createSubModules();

        const argsLeftOver = process.argv.slice(2);
        const skipTransformation = pullFlag(
            argsLeftOver,
            "--skip-transformation",
        );

        if (!skipTransformation) {
            const result = await performTransformation(mainRepoDir, {
                migrationBranchName: "migrate-from-submodules-to-monorepo",
                createReport: true,
            });

            //await createTreeFile(mainRepoDir, "tree-after.json", resolve(mainRepoDir, ".."));

            const beforeTree = readFileSync(result.treeBeforePath!, {
                encoding: "utf-8",
            });
            const afterTree = readFileSync(result.treeAfterPath!, {
                encoding: "utf-8",
            });
            const equal = beforeTree == afterTree;

            if (equal) {
                console.log("🟢 Tree remained equal!")
                console.log("Test passed! 👍");
            }else{
                console.error("🔴 Tree did not remain equal!")
                console.error("Test failed! 👎");
                process.exit(1);
            }
        }
    } catch (e) {
        console.log("Test failed!");
        console.log(e);
    }
})();
