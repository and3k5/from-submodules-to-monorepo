const { resolve } = require("path");
const { createSubModules } = require("./create-submodules");
const { performTransformation } = require("../perform-transformation");
const { createFile } = require("./utils/fs/create-file");
const { readFileSync } = require("fs");
const { pullFlag } = require("../utils/args/pull-flag");
const { getFileTree } = require("../utils/files/file-tree");

(async function () {
    try {
        const mainRepoDir = await createSubModules();

        const argsLeftOver = process.argv.slice(2);
        const skipTransformation = pullFlag(
            argsLeftOver,
            "--skip-transformation",
        );

        createFile(
            resolve(mainRepoDir, ".."),
            "tree-before.txt",
            await getFileTree(mainRepoDir, { excludedFiles: [".gitmodules"] }),
        );

        if (!skipTransformation) {
            await performTransformation(mainRepoDir, {
                migrationBranchName: "migrate-from-submodules-to-monorepo",
            });

            createFile(
                resolve(mainRepoDir, ".."),
                "tree-after.txt",
                await getFileTree(mainRepoDir, {
                    excludedFiles: [".gitmodules"],
                }),
            );

            const beforeTree = readFileSync(
                resolve(mainRepoDir, "..", "tree-before.txt"),
                { encoding: "utf-8" },
            );
            const afterTree = readFileSync(
                resolve(mainRepoDir, "..", "tree-after.txt"),
                { encoding: "utf-8" },
            );
            const equal = beforeTree == afterTree;
            console.log("Tree remained equal: " + equal);

            if (equal) {
                console.log("Test passed!");
            } else {
                console.log("Test failed!");
            }
        }
    } catch (e) {
        console.log("Test failed!");
        console.log(e);
    }
})();
