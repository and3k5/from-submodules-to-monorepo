/**
 * @typedef {Object} Submodule
 * @property {string} name - The name of the submodule.
 * @property {string[]?} [additionalFiles] - Additional files to include in the submodule.
 * @property {string[]?} [additionalDirs] - Additional directories to include in the submodule.
 */

/**
 * @type {Submodule[]}
 */
module.exports.submodules = [
    { name: "documentation", additionalFiles: ["documentation"] },
    { name: "webserver", additionalDirs: ["webserver"] },
    { name: "commandline", additionalFiles: ["commandline"] },
];
