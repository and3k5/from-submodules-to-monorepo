import { Submodule } from "../../utils/git/read-gitmodules";
import { ConsoleBase } from "../../utils/output/console-wrapper";

export function introduceModule(
    submodule: Submodule,
    submodules: Submodule[],
    console: ConsoleBase,
) {
    console.log(` - Submodule: ${submodule.path}`);
    console.log(
        `   Position: ${submodules.indexOf(submodule)}/${submodules.length - 1}`,
    );
}
