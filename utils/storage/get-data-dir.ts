import { existsSync, mkdirSync } from "fs";
import { homedir } from "os";
import { resolve } from "path";
export function getDataDir() {
    const homeDir = homedir();
    const path = resolve(homeDir, ".from-submodules-to-monorepo");
    if (!existsSync(path)) {
        mkdirSync(path);
    }
    return path;
}

