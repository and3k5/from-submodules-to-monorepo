import { introduceModule } from "../introduceModule";
import { checkoutModule } from "../checkoutModule";
import { moveFiles } from "../moveFiles";
import { createConsoleWrapper } from "../../../utils/output/console-wrapper";
import { pushToOrigin } from "../pushToOrigin";
import { archiveUntrackedFiles } from "../archiveUntrackedFiles";
import { Submodule } from "../../../utils/git/read-gitmodules";

export async function applyTransformationForSubmodule(
    mainRepoDir: string,
    migrationBranchName: string,
    fullPath: string,
    submodule: Submodule,
    submodules: Submodule[],
    deleteExistingBranches: boolean,
    keepUntrackedFilesPath: string | undefined,
): Promise<string[]> {
    const console = createConsoleWrapper();

    introduceModule(submodule, submodules, console);
    checkoutModule(
        fullPath,
        migrationBranchName,
        deleteExistingBranches,
        console,
    );
    if (keepUntrackedFilesPath != null)
        await archiveUntrackedFiles(
            mainRepoDir,
            fullPath,
            submodule,
            keepUntrackedFilesPath,
            console,
        );
    moveFiles(mainRepoDir, fullPath, submodule, console);
    pushToOrigin(
        mainRepoDir,
        fullPath,
        migrationBranchName,
        submodule,
        console,
    );

    return console.contents;
}
