import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir, platform } from "os";
import { getFileTreeItems, getFileTree } from "./file-tree";

const isWin = platform() === "win32";

describe("getFileTreeItems / getFileTree", () => {
    const temps: string[] = [];
    const makeTempDir = (prefix = "file-tree-") => {
        const dir = mkdtempSync(join(tmpdir(), prefix));
        temps.push(dir);
        return dir;
    };
    afterEach(() => {
        for (const d of temps.splice(0))
            rmSync(d, { recursive: true, force: true });
    });

    it("builds a directory tree with files and nested directories", async () => {
        const dir = makeTempDir();
        writeFileSync(join(dir, "root.txt"), "hi");
        mkdirSync(join(dir, "sub"));
        writeFileSync(join(dir, "sub", "child.txt"), "yo");

        const tree = await getFileTreeItems(dir);

        expect(tree?.type).toBe("dir");
        if (tree?.type !== "dir") throw new Error("expected dir");
        expect(tree.children.some((c) => c.name === "root.txt")).toBe(true);
        const sub = tree.children.find((c) => c.name === "sub");
        expect(sub?.type).toBe("dir");
    });

    it("excludes files named in options.excludedFiles", async () => {
        const dir = makeTempDir();
        writeFileSync(join(dir, "keep.txt"), "");
        writeFileSync(join(dir, "drop.txt"), "");

        const tree = await getFileTreeItems(dir, {
            excludedFiles: ["drop.txt"],
        });
        if (tree?.type !== "dir") throw new Error("expected dir");

        expect(tree.children.some((c) => c.name === "keep.txt")).toBe(true);
        expect(tree.children.some((c) => c.name === "drop.txt")).toBe(false);
    });

    it("reports file size on file entries", async () => {
        const dir = makeTempDir();
        writeFileSync(join(dir, "sized.txt"), "12345");
        const tree = await getFileTreeItems(dir);
        if (tree?.type !== "dir") throw new Error("expected dir");
        const f = tree.children.find((c) => c.name === "sized.txt");
        expect(f?.type).toBe("file");
        if (f?.type === "file") expect(f.size).toBe(5);
    });

    it.runIf(!isWin)("classifies symlinks as type 'symlink'", async () => {
        const dir = makeTempDir();
        writeFileSync(join(dir, "target.txt"), "t");
        symlinkSync("target.txt", join(dir, "link.txt"));
        const tree = await getFileTreeItems(dir);
        if (tree?.type !== "dir") throw new Error("expected dir");
        const link = tree.children.find((c) => c.name === "link.txt");
        expect(link?.type).toBe("symlink");
    });

    it.runIf(!isWin)(
        'returns "{}" from getFileTree when the root itself is hidden',
        async () => {
            // On non-Windows the detector flags dot-prefixed basenames as hidden.
            const parent = makeTempDir();
            const hiddenRoot = join(parent, ".hiddenRoot");
            mkdirSync(hiddenRoot);
            writeFileSync(join(hiddenRoot, "inside.txt"), "");
            expect(await getFileTree(hiddenRoot)).toBe("{}");
        },
    );
});
