interface FileItem {
    name: string;
    type: "file";
    size: number;
}

interface DirectoryItem {
    name: string;
    type: "dir";
    children: Array<FileItem | DirectoryItem>;
}

interface GetFileTreeOptions {
    excludedFiles?: string[];
}

export function getFileTree(
    path: string,
    options?: GetFileTreeOptions,
): Promise<string>;
