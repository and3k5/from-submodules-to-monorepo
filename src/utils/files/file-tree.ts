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

interface SymlinkItem {
    name: string;
    type: "symlink";
}

export type FileTreeItem = FileItem | DirectoryItem | SymlinkItem;

interface GetFileTreeOptions {
    excludedFiles?: string[];
}

export async function getFileTreeItems(
    dirPath: string,
    options?: GetFileTreeOptions | undefined,
): Promise<FileTreeItem | undefined> {
    dirPath = resolve(dirPath);

    const hiddenDetector = await createHiddenDetector(dirPath);

    function buildTree(currentPath: string): FileTreeItem | undefined {
        const stats = fs.lstatSync(currentPath);

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
        } else if (stats.isSymbolicLink()) {
            return {
                name: basename(currentPath),
                type: "symlink",
            };
        } else {
            throw new Error(
                `Unsupported file type for ${currentPath} in file tree generation! File: ${stats.isFile()}, Directory: ${stats.isDirectory()}, SymbolicLink: ${stats.isSymbolicLink()}, Size: ${stats.size}`,
            );
        }
    }

    const resolvedDirPath = resolve(dirPath);
    try {
        return buildTree(resolvedDirPath);
    } catch (e) {
        throw new Error(
            `Error creating tree for ${resolvedDirPath}: ${(e as Error).message}`,
        );
    }
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

if (import.meta.main) {
    getFileTree(process.argv[2]).then((x) => console.log(x));
}
