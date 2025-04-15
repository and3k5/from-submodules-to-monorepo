import { join } from "path";
import { getFileTree } from "../utils/files/file-tree";
import { writeFileSync } from "fs";

export async function createTreeFile(
    dir: string,
    filename: string,
    location: string,
): Promise<string> {
    const content = await getFileTree(dir, {
        excludedFiles: [".gitmodules"],
    });

    const fullPath = join(location, filename);

    writeFileSync(join(location, filename), content, { encoding: "utf8" });

    return fullPath;
}
