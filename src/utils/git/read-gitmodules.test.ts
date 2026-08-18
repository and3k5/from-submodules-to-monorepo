import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { readGitmodules } from "./read-gitmodules";

describe("readGitmodules", () => {
    const temps: string[] = [];
    const writeGitmodules = (content: string): string => {
        const dir = mkdtempSync(join(tmpdir(), "read-gitmodules-"));
        temps.push(dir);
        const file = join(dir, ".gitmodules");
        writeFileSync(file, content);
        return file;
    };
    afterEach(() => {
        for (const d of temps.splice(0))
            rmSync(d, { recursive: true, force: true });
    });

    it("parses multiple submodules with path and url", () => {
        const file = writeGitmodules(
            [
                '[submodule "libA"]',
                "\tpath = libA",
                "\turl = https://example.com/libA.git",
                '[submodule "libB"]',
                "\tpath = libB",
                "\turl = https://example.com/libB.git",
            ].join("\n"),
        );
        expect(readGitmodules(file)).toEqual([
            { path: "libA", url: "https://example.com/libA.git" },
            { path: "libB", url: "https://example.com/libB.git" },
        ]);
    });

    it("returns an empty array for an empty file", () => {
        expect(readGitmodules(writeGitmodules(""))).toEqual([]);
    });

    it("truncates a url value at an embedded '=' (documents split('=') limitation)", () => {
        const file = writeGitmodules(
            ['[submodule "x"]', "\tpath = x", "\turl = file://host/a=b"].join(
                "\n",
            ),
        );
        const parsed = readGitmodules(file);
        expect(parsed[0].path).toBe("x");
        // Current behavior: destructuring split("=") keeps only up to the first value segment.
        expect(parsed[0].url).toBe("file://host/a");
    });
});
