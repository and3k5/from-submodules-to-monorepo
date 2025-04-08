const { run } = require("../process/run");

/**
 *
 * @param {string} dir
 * @returns {string[]}
 */
function getBranches(dir) {
    const result = run("git", ["--no-pager", "branch", "--format=%(refname)"], {
        encoding: "utf-8",
        cwd: dir,
    });
    return result.stdout
        .trim()
        .split("\n")
        .map((x) => x.trim())
        .filter((x) => x.length > 0);
}

module.exports.getBranches = getBranches;
