import { describe, it, expect, afterEach } from "vitest";
import {
    mkdtempSync,
    mkdirSync,
    writeFileSync,
    readFileSync,
    rmSync,
} from "fs";
import { join, sep } from "path";
import { tmpdir } from "os";
import { createTreeFile, flattenTreeToList } from "./create-tree-file";
import type { FileTreeItem } from "../utils/files/file-tree";

// ── flattenTreeToList ──────────────────────────────────────────────────────────

describe("flattenTreeToList", () => {
    it("returns a single entry for a file", () => {
        const item: FileTreeItem = {
            name: "readme.txt",
            type: "file",
            size: 42,
        };
        expect(flattenTreeToList(item, "/base")).toEqual([
            `/base${sep}readme.txt:42`,
        ]);
    });

    it("returns empty-dir entry for a directory with no children", () => {
        const item: FileTreeItem = { name: "empty", type: "dir", children: [] };
        expect(flattenTreeToList(item, "/base")).toEqual([
            `/base${sep}empty:empty-dir`,
        ]);
    });

    it("returns undefined for a directory with nullish children", () => {
        const item = {
            name: "broken",
            type: "dir",
            children: null,
        } as unknown as FileTreeItem;
        expect(flattenTreeToList(item, "/base")).toBeUndefined();
    });

    it("flattens a directory containing files", () => {
        const item: FileTreeItem = {
            name: "src",
            type: "dir",
            children: [
                { name: "a.ts", type: "file", size: 10 },
                { name: "b.ts", type: "file", size: 20 },
            ],
        };
        expect(flattenTreeToList(item, "/base")).toEqual([
            `/base${sep}src${sep}a.ts:10`,
            `/base${sep}src${sep}b.ts:20`,
        ]);
    });

    it("recursively flattens nested directories", () => {
        const item: FileTreeItem = {
            name: "root",
            type: "dir",
            children: [
                {
                    name: "sub",
                    type: "dir",
                    children: [{ name: "deep.ts", type: "file", size: 5 }],
                },
            ],
        };
        expect(flattenTreeToList(item, "/base")).toEqual([
            `/base${sep}root${sep}sub${sep}deep.ts:5`,
        ]);
    });

    it("handles a very large number of files without exceeding the call stack", () => {
        const manyFiles: FileTreeItem[] = Array.from(
            { length: 200_000 },
            (_, i) => ({
                name: `file${i}.ts`,
                type: "file" as const,
                size: i,
            }),
        );
        const item: FileTreeItem = {
            name: "root",
            type: "dir",
            children: [{ name: "sub", type: "dir", children: manyFiles }],
        };
        expect(() => flattenTreeToList(item, "/base")).not.toThrow();
        expect(flattenTreeToList(item, "/base")?.length).toBe(200_000);
    });

    it("skips children that return undefined", () => {
        const item: FileTreeItem = {
            name: "mixed",
            type: "dir",
            children: [
                // A dir with null children will return undefined from the recursive call
                {
                    name: "bad",
                    type: "dir",
                    children: null,
                } as unknown as FileTreeItem,
                { name: "good.ts", type: "file", size: 7 },
            ],
        };
        expect(flattenTreeToList(item, "/base")).toEqual([
            `/base${sep}mixed${sep}good.ts:7`,
        ]);
    });
});

// ── createTreeFile ─────────────────────────────────────────────────────────────

describe("createTreeFile", () => {
    const temps: string[] = [];

    const makeTempDir = () => {
        const dir = mkdtempSync(join(tmpdir(), "create-tree-file-test-"));
        temps.push(dir);
        return dir;
    };

    afterEach(() => {
        for (const dir of temps.splice(0)) {
            rmSync(dir, { recursive: true, force: true });
        }
    });

    it("returns the full path to the written file", async () => {
        const source = makeTempDir();
        writeFileSync(join(source, "hello.txt"), "hi");
        const out = makeTempDir();

        const result = await createTreeFile(source, "tree.json", out);

        expect(result).toBe(join(out, "tree.json"));
    });

    it("writes valid JSON containing the directory tree", async () => {
        const source = makeTempDir();
        writeFileSync(join(source, "foo.ts"), "export {}");
        const out = makeTempDir();

        await createTreeFile(source, "tree.json", out);

        const json = JSON.parse(readFileSync(join(out, "tree.json"), "utf8"));
        expect(json.type).toBe("dir");
        expect(
            json.children.some((c: FileTreeItem) => c.name === "foo.ts"),
        ).toBe(true);
    });

    it("excludes .gitmodules from the tree", async () => {
        const source = makeTempDir();
        writeFileSync(join(source, "real.ts"), "");
        writeFileSync(join(source, ".gitmodules"), "[submodule]");
        const out = makeTempDir();

        await createTreeFile(source, "tree.json", out);

        const json = JSON.parse(readFileSync(join(out, "tree.json"), "utf8"));
        expect(
            json.children.some((c: FileTreeItem) => c.name === ".gitmodules"),
        ).toBe(false);
        expect(
            json.children.some((c: FileTreeItem) => c.name === "real.ts"),
        ).toBe(true);
    });

    it("writes a _filelist.txt alongside the tree file", async () => {
        const source = makeTempDir();
        writeFileSync(join(source, "item.txt"), "data");
        const out = makeTempDir();

        await createTreeFile(source, "tree.json", out);

        const list = readFileSync(join(out, "tree.json_filelist.txt"), "utf8");
        expect(list).toContain("item.txt");
    });

    it("handles an empty source directory", async () => {
        const source = makeTempDir();
        const out = makeTempDir();

        await createTreeFile(source, "tree.json", out);

        const json = JSON.parse(readFileSync(join(out, "tree.json"), "utf8"));
        expect(json.type).toBe("dir");
        expect(json.children).toEqual([]);
    });

    it("includes files in nested subdirectories", async () => {
        const source = makeTempDir();
        mkdirSync(join(source, "sub"));
        writeFileSync(join(source, "sub", "nested.ts"), "");
        const out = makeTempDir();

        await createTreeFile(source, "tree.json", out);

        const json = JSON.parse(readFileSync(join(out, "tree.json"), "utf8"));
        const sub = json.children.find((c: FileTreeItem) => c.name === "sub");
        expect(sub?.type).toBe("dir");
        expect(
            sub?.children.some((c: FileTreeItem) => c.name === "nested.ts"),
        ).toBe(true);
    });

    it("captures deeply recursive paths in both the JSON tree and the filelist", async () => {
        const source = makeTempDir();
        mkdirSync(join(source, "a", "b", "c"), { recursive: true });
        writeFileSync(join(source, "a", "b", "c", "deep.ts"), "x");
        writeFileSync(join(source, "a", "b", "mid.ts"), "y");
        writeFileSync(join(source, "root.ts"), "z");
        const out = makeTempDir();

        await createTreeFile(source, "tree.json", out);

        const json = JSON.parse(readFileSync(join(out, "tree.json"), "utf8"));

        // Traverse the JSON tree to verify structure at each level
        const a = json.children.find((c: FileTreeItem) => c.name === "a");
        expect(a?.type).toBe("dir");
        const b = a?.children.find((c: FileTreeItem) => c.name === "b");
        expect(b?.type).toBe("dir");
        const c = b?.children.find((c: FileTreeItem) => c.name === "c");
        expect(c?.type).toBe("dir");
        expect(
            c?.children.some((c: FileTreeItem) => c.name === "deep.ts"),
        ).toBe(true);
        expect(b?.children.some((c: FileTreeItem) => c.name === "mid.ts")).toBe(
            true,
        );
        expect(
            json.children.some((c: FileTreeItem) => c.name === "root.ts"),
        ).toBe(true);

        // Verify the filelist contains all three files at their full paths
        const list = readFileSync(join(out, "tree.json_filelist.txt"), "utf8");
        expect(list).toContain(join("a", "b", "c", "deep.ts"));
        expect(list).toContain(join("a", "b", "mid.ts"));
        expect(list).toContain("root.ts");
    });
});
