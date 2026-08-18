import { describe, it, expect } from "vitest";
import { resolve } from "path";
import {
    fileSystemRemoteUrl,
    fileSystemRemotePrefix,
} from "./file-system-remote-url";

describe("fileSystemRemoteUrl", () => {
    it("prefixes with file:// and resolves to an absolute path", () => {
        const url = fileSystemRemoteUrl("some/relative/path");
        expect(url.startsWith(fileSystemRemotePrefix)).toBe(true);
        expect(url).toBe(
            fileSystemRemotePrefix +
                resolve("some/relative/path").replace(/\\/g, "/"),
        );
    });

    it("uses forward slashes only (no backslashes even on Windows)", () => {
        const url = fileSystemRemoteUrl("a/b/c");
        expect(url.includes("\\")).toBe(false);
    });

    it("exposes the expected prefix constant", () => {
        expect(fileSystemRemotePrefix).toBe("file://");
    });
});
