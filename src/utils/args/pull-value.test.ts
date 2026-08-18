import { describe, it, expect } from "vitest";
import { pullValue } from "./pull-value";

describe("pullValue", () => {
    it("shifts and returns the first element", () => {
        const args = ["first", "second"];
        expect(pullValue(args)).toBe("first");
        expect(args).toEqual(["second"]);
    });

    it("returns undefined and leaves an empty array untouched", () => {
        const args: string[] = [];
        expect(pullValue(args)).toBeUndefined();
        expect(args).toEqual([]);
    });

    it("drains the array across repeated calls", () => {
        const args = ["a", "b"];
        expect(pullValue(args)).toBe("a");
        expect(pullValue(args)).toBe("b");
        expect(pullValue(args)).toBeUndefined();
    });
});
