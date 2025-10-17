import { existsSync, mkdirSync } from "fs";
import { getDataDir } from "./get-data-dir";
import { resolve } from "path";
export function createTempDir() {
    const dataDir = getDataDir();
    let tempName: string;
    do {
        tempName = makeTempName();
    } while (existsSync(resolve(dataDir, tempName)));
    const path = resolve(dataDir, tempName);
    mkdirSync(path);
    return path;
}

function makeTempName() {
    let result = "";
    for (let i = 0; i < 10; i++) {
        result += String.fromCharCode(Math.round(65 + Math.random() * 25));
    }
    return result;
}
