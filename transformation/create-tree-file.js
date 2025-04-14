const { join } = require("path");
const { getFileTree } = require("../utils/files/file-tree");
const { writeFileSync } = require("fs");

/**
 *
 * @param {string} dir
 * @param {string} filename
 * @param {string} location
 * @returns {string}
 */
async function createTreeFile(dir, filename, location) {
    const content = await getFileTree(dir, {
        excludedFiles: [".gitmodules"],
    });

    const fullPath = join(location, filename);

    writeFileSync(join(location, filename), content, { encoding: "utf8" });

    return fullPath;
}

module.exports.createTreeFile = createTreeFile;
