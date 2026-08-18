import { describe, it, expect, afterEach } from "vitest";
import { execFileSync } from "child_process";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir, platform } from "os";
import { alignPathLayout, createHiddenDetector } from "./hidden-detector";

const isWin = platform() === "win32";

describe("alignPathLayout", () => {
    it("normalizes separators to forward slashes and uppercases", () => {
        expect(alignPathLayout("a\\b\\c")).toBe("A/B/C");
    });

    it("normalizes . and .. segments", () => {
        expect(alignPathLayout("a/./b/../c")).toBe("A/C");
    });
});

describe("createHiddenDetector (non-Windows)", () => {
    it.runIf(!isWin)(
        "flags only dot-prefixed basenames as hidden",
        async () => {
            const detector = await createHiddenDetector("/tmp");
            expect(detector("/tmp/.hidden")).toBe(true);
            expect(detector("/tmp/visible.txt")).toBe(false);
        },
    );
});

describe("createHiddenDetector (Windows attrib decoding)", () => {
    const temps: string[] = [];
    const makeTempDir = () => {
        const dir = mkdtempSync(join(tmpdir(), "hidden-detector-"));
        temps.push(dir);
        return dir;
    };
    afterEach(() => {
        for (const d of temps.splice(0))
            rmSync(d, { recursive: true, force: true });
    });

    // Validates the decode fix: a Danish-named (non-ASCII) file must be found in the attrib map
    // and its Hidden attribute reported correctly. Before the fix the OEM-vs-UTF8 mismatch made
    // such a path fail to match the map.
    it.runIf(isWin)(
        "correctly reports the Hidden attribute for non-ASCII (Danish) filenames",
        async () => {
            const dir = makeTempDir();
            const hidden = join(dir, "skjultÆØÅ.txt");
            const plain = join(dir, "synligÆØÅ.txt");
            const normal = join(dir, "normal.txt");
            writeFileSync(hidden, "x");
            writeFileSync(plain, "x");
            writeFileSync(normal, "x");
            execFileSync("attrib", ["+H", hidden]);

            const detector = await createHiddenDetector(dir);

            expect(detector(hidden)).toBe(true);
            expect(detector(plain)).toBe(false);
            expect(detector(normal)).toBe(false);
        },
    );
});
