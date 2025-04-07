/**
 * @typedef {Object} Submodule
 * @property {string} name - The name of the submodule.
 * @property {string[]?} [additionalFiles] - Additional files to include in the submodule.
 * @property {string[]?} [additionalDirs] - Additional directories to include in the submodule.
 * @property {string[]?} [pullFrom] - Existing submodules to pull from.
 * @property {boolean?} [skipAddAsSubmodule] - Dont add this as a submodule
 */

/**
 * @type {Submodule[]}
 */
module.exports.submodules = [
    {
        name: "commons",
        customReadMeName: "README-commons.md",
        skipAddAsSubmodule: true,
    },
    { name: "documentation", additionalFiles: ["documentation"] },
    { name: "webserver", additionalDirs: ["webserver"], pullFrom: ["commons"] },
    {
        name: "commandline",
        additionalFiles: ["commandline"],
        pullFrom: ["commons"],
    },
];
