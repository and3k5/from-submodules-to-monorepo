const { writeFileSync } = require("fs");
const { join } = require("path");

/**
 *
 * @param {string} dir
 * @param {string} filename
 * @param {string} content
 */
function createFile(dir, filename, content) {
    writeFileSync(join(dir, filename), content, { encoding: "utf8" });
}

module.exports.createFile = createFile;
