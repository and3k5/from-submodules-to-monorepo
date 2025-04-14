/**
 * @type {import("./submodules").Submodule[]}
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
