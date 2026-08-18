import { describe, it, expect } from "vitest";
import { pullFlag } from "./pull-flag";

describe("pullFlag", () => {
    it("returns true and removes the flag when present", () => {
        const args = ["--foo", "value", "--bar"];
        expect(pullFlag(args, "--bar")).toBe(true);
        expect(args).toEqual(["--foo", "value"]);
    });

    it("returns false and leaves the array unchanged when absent", () => {
        const args = ["--foo", "value"];
        expect(pullFlag(args, "--missing")).toBe(false);
        expect(args).toEqual(["--foo", "value"]);
    });

    it("removes only the first occurrence", () => {
        const args = ["--x", "--x"];
        expect(pullFlag(args, "--x")).toBe(true);
        expect(args).toEqual(["--x"]);
    });

    it("returns false for an empty argument list", () => {
        const args: string[] = [];
        expect(pullFlag(args, "--anything")).toBe(false);
        expect(args).toEqual([]);
    });
});
