import crypto from "crypto";
import { ensureSameCaseForPath } from "../path/ensure-same-case-for-path";
import { join } from "path";
import { Submodule } from "./read-gitmodules";

export function getOriginNameForSubmodule(
    mainRepoDir: string,
    submodule: Submodule,
): string {
    if (submodule.path == null) throw new Error("missing path for submodule");
    const actualSubmodulePath = ensureSameCaseForPath(
        join(mainRepoDir, submodule.path),
    );
    const hash = crypto
        .createHash("md5")
        .update(actualSubmodulePath.toUpperCase())
        .digest("hex");
    return submodule.path + "_" + hash;
}
