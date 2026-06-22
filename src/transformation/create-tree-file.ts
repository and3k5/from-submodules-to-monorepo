import { join, dirname } from "path";
import {
    FileTreeItem,
    getFileTreeItems,
    renderFileTree,
} from "../utils/files/file-tree";
import { writeFileSync } from "fs";

export async function createTreeFile(
    dir: string,
    filename: string,
    location: string,
): Promise<string> {
    const fileTree = await getFileTreeItems(dir, {
        excludedFiles: [".gitmodules"],
    });
    const content = fileTree ? await renderFileTree(fileTree) : "{}";

    const fullPath = join(location, filename);

    writeFileSync(join(location, filename), content, { encoding: "utf8" });

    if (fileTree) {
        const content2 = flattenTreeToList(fileTree, dirname(dir))?.join("\n") ?? "";

        writeFileSync(join(location, filename) + "_filelist.txt", content2, {
            encoding: "utf8",
        });
    }

    return fullPath;
}

export function flattenTreeToList(
    fileTree: FileTreeItem,
    path: string,
): string[] | undefined {
    if (fileTree.type === "file") {
        return [join(path, fileTree.name) + ":" + fileTree.size];
    }
    if (fileTree.type === "dir") {
        if (!fileTree.children) {
            return undefined;
        }
        if (fileTree.children.length === 0) {
            return [join(path, fileTree.name) + ":empty-dir"];
        }
        const result: string[] = [];
        for (const child of fileTree.children) {
            const res = flattenTreeToList(child, join(path, fileTree.name));
            if (!res) continue;
            for (const r of res) {
                result.push(r);
            }
        }
        return result;
    }
    return undefined;
}

if (import.meta.main) {
    const dir = process.argv[2];
    const filename = process.argv[3];
    const location = process.argv[4];
    console.log(`Creating tree file for ${dir} at ${join(location, filename)}`);
    createTreeFile(dir, filename, location).then((x) => console.log(x));
}
