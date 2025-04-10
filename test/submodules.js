/**
 * @typedef {Object} Modifier
 * @property {string} file - The file to modify.
 * @property {string} content - The content to add to the file.
 */
/**
 * @typedef {Object} Submodule
 * @property {string} name - The name of the submodule.
 * @property {string[]?} [additionalFiles] - Additional files to include in the submodule.
 * @property {string?} [renameFolder] - Rename the submodule folder to something else
 * @property {string?} [customReadMeName] - Custom readme filename
 * @property {string[]?} [additionalDirs] - Additional directories to include in the submodule.
 * @property {string[]?} [pullFrom] - Existing submodules to pull from.
 * @property {boolean?} [skipAddAsSubmodule] - Dont add this as a submodule
 * @property {string[]?} [deletes] - Existing submodules to pull from.
 * @property {Modifier[]?} [modifiers] - Existing submodules to pull from.
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
    {
        name: "Webserver",
        additionalDirs: ["Webserver"],
        pullFrom: ["commons"],
        renameFolder: "webserver",
    },
    {
        name: "Documentation",
        additionalFiles: ["Documentation"],
        renameFolder: "documentation",
    },
    {
        name: "Commandline",
        additionalFiles: ["commandline"],
        pullFrom: ["commons"],
        renameFolder: "commandline",
    },
    {
        name: "service",
        pullFrom: ["commons"],
        modifiers: [{ file: "README-commons.md", content: "Foobar" }],
    },
    {
        name: "surveillance",
        pullFrom: ["commons"],
        deletes: ["README-commons.md"],
    },
    {
        name: "worker",
        pullFrom: ["commons"],
        modifiers: [{ file: "README-commons.md", content: "Foobar2" }],
    },
    {
        name: "data-and-stuff",
        pullFrom: ["commons"],
        additionalFiles: ["DEMO.md"],
        renameFolder: "data",
    },
];
