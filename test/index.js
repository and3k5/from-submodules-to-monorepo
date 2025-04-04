const { resolve } = require("path");
const { createSubModules } = require("./create-submodules");
const { run } = require("../utils/process/run");
const { performTransformation } = require("../perform-transformation");
const { createFile } = require("./utils/fs/create-file");
const { readFileSync } = require("fs");
const { pullFlag } = require("../utils/args/pull-flag");

(async function () {
    try {
        const mainRepoDir = await createSubModules();
        const tree = run("tree", ["/f", "/a"], {
            encoding: "utf-8",
            cwd: mainRepoDir,
        }).stdout;

        const argsLeftOver = process.argv.slice(2);
        const skipTransformation = pullFlag(
            argsLeftOver,
            "--skip-transformation",
        );

        createFile(resolve(mainRepoDir, ".."), "tree-before.txt", tree);

        if (!skipTransformation) {
            await performTransformation(
                mainRepoDir,
                "migrate-from-submodules-to-monorepo",
            );

            const tree2 = run("tree", ["/f", "/a"], {
                encoding: "utf-8",
                cwd: mainRepoDir,
            }).stdout;
            createFile(resolve(mainRepoDir, ".."), "tree-after.txt", tree2);

            const beforeTree = readFileSync(
                resolve(mainRepoDir, "..", "tree-before.txt"),
                { encoding: "utf-8" },
            );
            const afterTree = readFileSync(
                resolve(mainRepoDir, "..", "tree-before.txt"),
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
