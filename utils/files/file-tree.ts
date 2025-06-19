import fs from "fs";
import { createHiddenDetector } from "./hidden-detector";
import { resolve, basename, join } from "path";

interface FileItem {
    name: string;
    type: "file";
    size: number;
}

interface DirectoryItem {
    name: string;
    type: "dir";
    children: Array<FileTreeItem>;
}

export type FileTreeItem = FileItem | DirectoryItem;

interface GetFileTreeOptions {
    excludedFiles?: string[];
}

export async function getFileTreeItems(
    dirPath: string,
    options?: GetFileTreeOptions | undefined,
): Promise<DirectoryItem | FileItem | undefined> {
    dirPath = resolve(dirPath);

    const hiddenDetector = await createHiddenDetector(dirPath);

    function buildTree(currentPath: string): FileTreeItem | undefined {
        const stats = fs.statSync(currentPath);

        if (hiddenDetector(currentPath)) {
            return undefined;
        }

        if (options?.excludedFiles?.includes(basename(currentPath))) {
            return undefined;
        }

        if (stats.isFile()) {
            return {
                name: basename(currentPath),
                type: "file",
                size: stats.size,
            };
        } else if (stats.isDirectory()) {
            const children = fs
                .readdirSync(currentPath)
                .map((child) => buildTree(join(currentPath, child)))
                .filter((x) => x !== undefined);
            return {
                name: basename(currentPath),
                type: "dir",
                children: children,
            };
        }
    }

    return buildTree(resolve(dirPath));
}

export async function renderFileTree(treeItem: FileTreeItem): Promise<string> {
    return JSON.stringify(treeItem, null, 4);
}

export async function getFileTree(
    path: string,
    options?: GetFileTreeOptions,
): Promise<string> {
    const fileTree = await getFileTreeItems(path, options);
    if (!fileTree) return "{}";
    return await renderFileTree(fileTree);
}

if (require.main?.id === module.id) {
    getFileTree(process.argv[2]).then((x) => console.log(x));
}
