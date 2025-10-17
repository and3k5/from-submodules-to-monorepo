import { readdirSync } from "fs";
import { dirname, basename } from "path";

export function fileExistsWithCaseSync(filepath) {
    const dir = dirname(filepath);
    if (dir === "/" || dir === ".") return true;
    const filenames = readdirSync(dir);
    if (filenames.indexOf(basename(filepath)) === -1) {
        return false;
    }
    return fileExistsWithCaseSync(dir);
}
