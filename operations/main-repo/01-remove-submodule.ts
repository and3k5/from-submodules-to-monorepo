import { execFileSync } from "child_process";
import { ensureSameCaseForPath } from "../../utils/path/ensure-same-case-for-path";
import { run } from "../../utils/process/run";
import { basename, join } from "path";
import { Submodule } from "../../utils/git/read-gitmodules";
import { ConsoleBase } from "../../utils/output/console-wrapper";

export async function removeSubmodule(
    mainRepoDir: string,
    submodule: Submodule,
    console: ConsoleBase,
) {
    if (submodule.path == null) throw new Error("missing path for submodule");
    console.log("   Removing submodule from main repo");

    run(
        "git",
        [
            "rm",
            "-f",
            basename(ensureSameCaseForPath(join(mainRepoDir, submodule.path))),
        ],
        {
            cwd: mainRepoDir,
        },
    );

    console.log("   Committing submodule removal");

    execFileSync(
        "git",
        ["commit", "-m", `Remove submodule: ${submodule.path}`],
        {
            cwd: mainRepoDir,
        },
    );
}
