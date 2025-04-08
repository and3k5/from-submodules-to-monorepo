const { readdirSync } = require("fs");
const { dirname, basename } = require("path");

function fileExistsWithCaseSync(filepath) {
    var dir = dirname(filepath);
    if (dir === "/" || dir === ".") return true;
    var filenames = readdirSync(dir);
    if (filenames.indexOf(basename(filepath)) === -1) {
        return false;
    }
    return fileExistsWithCaseSync(dir);
}
module.exports.fileExistsWithCaseSync = fileExistsWithCaseSync;
