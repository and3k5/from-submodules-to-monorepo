const { existsSync, mkdirSync } = require("fs");
const { homedir } = require("os");
const { resolve } = require("path");
function getDataDir() {
    const homeDir = homedir();
    const path = resolve(homeDir, ".from-submodules-to-monorepo");
    if (!existsSync(path)) {
        mkdirSync(path);
    }
    return path;
}
module.exports.getDataDir = getDataDir;
