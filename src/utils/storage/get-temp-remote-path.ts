import { existsSync, mkdirSync } from "fs";
import { getDataDir } from "./get-data-dir";
import { resolve } from "path";
export function getRemotePath() {
    const dataDir = getDataDir();
    const path = resolve(dataDir, "remotes");
    if (!existsSync(path)) {
        mkdirSync(path);
    }
    return path;
}
