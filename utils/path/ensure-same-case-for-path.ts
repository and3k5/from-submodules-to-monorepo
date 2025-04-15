import { existsSync, readdirSync } from "fs";
import { platform } from "os";
import { dirname, basename, join } from "path";

export function ensureSameCaseForPath(path: string): string {
    if (platform() !== "win32") {
        return path;
    }
    if (!existsSync(path)) {
        return path;
    }

    const dir = dirname(path);
    if (dir !== "/" && dir !== ".") {
        const names = readdirSync(dir);
        const baseName = basename(path).toUpperCase();
        const match = names.find((x) => x.toUpperCase() === baseName);
        if (match != null) return join(ensureSameCaseForPath(dir), match);
    }

    return path;
}
