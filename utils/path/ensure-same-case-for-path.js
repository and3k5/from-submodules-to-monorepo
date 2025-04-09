const { existsSync, readdirSync } = require("fs");
const { platform } = require("os");
const { dirname, basename, join } = require("path");

/**
 *
 * @param {string} path
 * @returns {string}
 */
function ensureSameCaseForPath(path) {
    if (platform() !== "win32") {
        return path;
    }
    if (!existsSync(path)) {
        return path;
    }

    const dir = dirname(path);
    if (dir !== "/" && dir !== ".") {
        const names = readdirSync(dir);
        const baseName = basename(path).toUpperCase();
        const match = names.find((x) => x.toUpperCase() === baseName);
        if (match != null) return join(ensureSameCaseForPath(dir), match);
    }

    return path;
}

module.exports.ensureSameCaseForPath = ensureSameCaseForPath;
