const { existsSync, mkdirSync } = require("fs");
const { getDataDir } = require("./get-data-dir");
const { resolve } = require("path");
function getRemotePath() {
    const dataDir = getDataDir();
    const path = resolve(dataDir, "remotes");
    if (!existsSync(path)) {
        mkdirSync(path);
    }
    return path;
}
module.exports.getRemotePath = getRemotePath;
