import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { platform } from "os";
import { ensureSameCaseForPath } from "./ensure-same-case-for-path";

const isWin = platform() === "win32";

describe("ensureSameCaseForPath", () => {
    const temps: string[] = [];
    const makeTempDir = () => {
        const dir = mkdtempSync(join(tmpdir(), "ensure-case-"));
        temps.push(dir);
        return dir;
    };
    afterEach(() => {
        for (const d of temps.splice(0))
            rmSync(d, { recursive: true, force: true });
    });

    it.skipIf(isWin)("is an identity function on non-Windows", () => {
        const p = join("/does", "not", "Exist", "Anywhere");
        expect(ensureSameCaseForPath(p)).toBe(p);
    });

    it.skipIf(isWin)(
        "returns non-existent paths unchanged on non-Windows",
        () => {
            const base = makeTempDir();
            const p = join(base, "MissingChild");
            expect(ensureSameCaseForPath(p)).toBe(p);
        },
    );

    it.runIf(isWin)(
        "fixes the casing of an existing directory on Windows",
        () => {
            const base = makeTempDir();
            mkdirSync(join(base, "MixedCaseDir"));
            // Query with the wrong case; the case-insensitive FS resolves it, and the helper
            // must return the real on-disk casing.
            const resolved = ensureSameCaseForPath(join(base, "mixedcasedir"));
            expect(resolved.endsWith("MixedCaseDir")).toBe(true);
        },
    );
});
