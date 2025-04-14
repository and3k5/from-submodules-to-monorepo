const fs = require("fs");
const { createHiddenDetector } = require("./hidden-detector");
const { resolve, basename, join } = require("path");

/**
 *
 * @param {string} dirPath
 * @param {import("./file-tree").GetFileTreeOptions} options
 * @returns {Promise<import("./file-tree").FileItem|import("./file-tree").DirectoryItem>}
 */
async function getFileTreeItems(dirPath, options) {
    dirPath = resolve(dirPath);

    const hiddenDetector = await createHiddenDetector(dirPath);

    /**
     *
     * @param {string} currentPath
     * @returns {import("./file-tree").FileItem|import("./file-tree").DirectoryItem|undefined}
     */
    function buildTree(currentPath) {
        const stats = fs.statSync(currentPath);

        if (hiddenDetector(currentPath)) {
            return undefined;
        }

        if (options?.excludedFiles.includes(basename(currentPath))) {
            return undefined;
        }

        if (stats.isFile()) {
            return {
                name: basename(currentPath),
                type: "file",
                size: stats.size,
            };
        } else if (stats.isDirectory()) {
            const children = fs
                .readdirSync(currentPath)
                .map((child) => buildTree(join(currentPath, child)))
                .filter((x) => x !== undefined);
            return {
                name: basename(currentPath),
                type: "dir",
                children: children,
            };
        }
    }

    return buildTree(resolve(dirPath));
}

/**
 * @param {import("./file-tree").FileItem | import("./file-tree").DirectoryItem} treeItem
 * @returns {Promise<string>}
 */
async function renderFileTree(treeItem) {
    return JSON.stringify(treeItem, null, 4);
}

async function getFileTree(path, options) {
    return await renderFileTree(await getFileTreeItems(path, options));
}

if (module.id === ".") {
    getFileTree(process.argv[2]).then((x) => console.log(x));
} else {
    module.exports.getFileTree = getFileTree;
}
