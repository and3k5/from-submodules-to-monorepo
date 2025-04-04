const { readdirSync, rmSync } = require("fs");
const { resolve } = require("path");

/**
 *
 * @param {string} dir
 * @param {string[] | undefined} exclude
 */
function cleanDirSync(dir, exclude = undefined) {
    const entries = readdirSync(dir, {
        encoding: "utf-8",
    });
    for (const entry of entries) {
        if (exclude?.includes(entry) === true) continue;
        rmSync(resolve(dir, entry), {
            recursive: true,
        });
    }
}

module.exports.cleanDirSync = cleanDirSync;
