export const submodules: Submodule[] = [
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

interface Modifier {
    /** The file to modify. */
    file: string;
    /** The content to add to the file. */
    content: string;
}
export interface Submodule {
    /** The name of the submodule. */
    name: string;
    /** Additional files to include in the submodule. */
    additionalFiles?: string[];
    /** Rename the submodule folder to something else */
    renameFolder?: string;
    /** Custom readme filename */
    customReadMeName?: string;
    /** Additional directories to include in the submodule. */
    additionalDirs?: string[];
    /** Existing submodules to pull from. */
    pullFrom?: string[];
    /** Dont add this as a submodule */
    skipAddAsSubmodule?: boolean;
    /** Existing submodules to pull from. */
    deletes?: string[];
    /** Existing submodules to pull from. */
    modifiers?: Modifier[];
}
