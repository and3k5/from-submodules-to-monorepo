import { join } from "path";
import { FileTreeItem, getFileTree, getFileTreeItems, renderFileTree } from "../utils/files/file-tree";
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
        const content2 = map(fileTree, dir)?.join("\n") ?? "";
        
        writeFileSync(join(location, filename)+"_filelist.txt", content2, { encoding: "utf8" });
    }

    return fullPath;
}

function map(fileTree : FileTreeItem, path: string) : string[] | undefined {
    if (fileTree.type === "file") {
        return [join(path, fileTree.name)+":"+fileTree.size];
    }
    if (fileTree.type === "dir") {
        if (!fileTree.children) {
            return undefined;
        }
        if (fileTree.children.length === 0) {
            return [join(path, fileTree.name)+":empty-dir"];
        }
        const result : string[] = [];
        for (const child of fileTree.children) { 
            const res = map(child, join(path, fileTree.name));
            if (!res) continue;
            result.push(...res);
        }
        return result;
    }
    return undefined;
}