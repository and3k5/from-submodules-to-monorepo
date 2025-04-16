/**
 * This function retrieves the version of the package from its package.json file.
 * @returns {string} The version of the package
 */
module.exports.getVersion = function () {
    return require("./package.json").version;
};
