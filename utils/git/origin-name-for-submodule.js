const crypto = require("crypto");
const { ensureSameCaseForPath } = require("../path/ensure-same-case-for-path");
const { join } = require("path");

/**
 *
 * @param {string} mainRepoDir
 * @param {import('./read-gitmodules').Submodule} submodule
 * @returns {string}
 */
function getOriginNameForSubmodule(mainRepoDir, submodule) {
    const actualSubmodulePath = ensureSameCaseForPath(
        join(mainRepoDir, submodule.path),
    );
    const hash = crypto
        .createHash("md5")
        .update(actualSubmodulePath.toUpperCase())
        .digest("hex");
    return submodule.path + "_" + hash;
}
module.exports.getOriginNameForSubmodule = getOriginNameForSubmodule;
