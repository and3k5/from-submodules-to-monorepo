interface Modifier {
    /** The file to modify. */
    file: string;
    /** The content to add to the file. */
    content: string;
}
interface Submodule {
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

export const submodules: Submodule[];
