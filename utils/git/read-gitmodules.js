const { readFileSync } = require("fs");

/**
 *
 * @param {string} filePath
 * @returns {import("./read-gitmodules").Submodule[]}
 */
function readGitmodules(filePath) {
    const content = readFileSync(filePath, "utf-8");
    const submodules = [];
    const lines = content.split("\n");
    let currentSubmodule = null;

    lines.forEach((line) => {
        line = line.trim();
        if (line.startsWith("[submodule")) {
            if (currentSubmodule) {
                submodules.push(currentSubmodule);
            }
            currentSubmodule = {};
        } else if (currentSubmodule) {
            const [key, value] = line.split("=").map((s) => s.trim());
            currentSubmodule[key] = value;
        }
    });

    if (currentSubmodule) {
        submodules.push(currentSubmodule);
    }

    return submodules;
}
module.exports.readGitmodules = readGitmodules;
