const { platform } = require("os");

/**
 * @param {string} nameA
 * @param {string} nameB
 * @returns {boolean}
 * @description
 * Compare two directory names to check if they are the same.
 */
function sameDirName(nameA, nameB) {
    switch (platform()) {
        case "win32":
            return nameA.toLowerCase() === nameB.toLowerCase();
        default:
            return nameA === nameB;
    }
}
module.exports.sameDirName = sameDirName;
