import { resolve } from "path";

export const fileSystemRemotePrefix = "file://";

export function fileSystemRemoteUrl(path) {
    return fileSystemRemotePrefix + resolve(path).replace(/\\/g, "/");
}
