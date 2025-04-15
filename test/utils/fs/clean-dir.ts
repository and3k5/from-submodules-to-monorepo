import { readdirSync, rmSync } from "fs";
import { resolve } from "path";

export function cleanDirSync(
    dir: string,
    exclude: string[] | undefined = undefined,
) {
    const entries = readdirSync(dir, {
        encoding: "utf-8",
    });
    for (const entry of entries) {
        if (exclude?.includes(entry) === true) continue;
        rmSync(resolve(dir, entry), {
            recursive: true,
        });
    }
}
