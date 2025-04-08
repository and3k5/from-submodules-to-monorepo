const { getBranches } = require("./get-branches");

/**
 *
 * @param {string} path
 * @param {string | string[]} branchNames
 * @returns
 */
function getMatchingBranch(path, branchNames) {
    const allBranches = getBranches(path)
        .filter((x) => x.startsWith("refs/heads/"))
        .map((x) => x.substring(11));
    if (!Array.isArray(branchNames)) {
        branchNames = [branchNames];
    }
    const matchingBranchName = allBranches.find((x) => branchNames.includes(x));
    return matchingBranchName;
}

module.exports.getMatchingBranch = getMatchingBranch;
