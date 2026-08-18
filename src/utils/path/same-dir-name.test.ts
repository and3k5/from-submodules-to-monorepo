import { describe, it, expect } from "vitest";
import { platform } from "os";
import { sameDirName } from "./same-dir-name";

const isWin = platform() === "win32";

describe("sameDirName", () => {
    it("treats identical names as equal on every platform", () => {
        expect(sameDirName("Module", "Module")).toBe(true);
    });

    it("treats differing names as not equal on every platform", () => {
        expect(sameDirName("ModuleA", "ModuleB")).toBe(false);
    });

    it("compares case-insensitively on Windows, case-sensitively elsewhere", () => {
        expect(sameDirName("Module", "module")).toBe(isWin);
    });
});
