import { describe, it, expect } from "vitest";
import { createConfig, getCommandValues } from "./command-config";

const config = createConfig({
    flags: {
        verbose: { identifier: "--verbose", description: "" },
        force: { identifier: "--force", description: "" },
    },
    values: {
        repoDir: { identifier: "repo-dir", description: "", required: true },
        branchName: { identifier: "branch-name", description: "" },
    },
});

describe("createConfig", () => {
    it("returns the same config object (identity helper for typing)", () => {
        expect(createConfig(config)).toBe(config);
    });
});

describe("getCommandValues", () => {
    it("parses flags (present/absent) and positional values in order", () => {
        const result = getCommandValues(config, [
            "--verbose",
            "/repo",
            "mybranch",
        ]);
        expect(result).not.toBeNull();
        expect(result!.flags.verbose).toBe(true);
        expect(result!.flags.force).toBe(false);
        expect(result!.values.repoDir).toBe("/repo");
        expect(result!.values.branchName).toBe("mybranch");
    });

    it("leaves an unsupplied optional value undefined (no defaults applied here)", () => {
        const result = getCommandValues(config, ["/repo"]);
        expect(result!.values.repoDir).toBe("/repo");
        expect(result!.values.branchName).toBeUndefined();
    });

    it("does not mutate the caller's argument array", () => {
        const args = ["--force", "/repo", "b"];
        getCommandValues(config, args);
        expect(args).toEqual(["--force", "/repo", "b"]);
    });

    it("returns null when more than one leftover token remains", () => {
        // two configured values consume two positionals; three extras -> >1 leftover -> null
        const result = getCommandValues(config, [
            "/repo",
            "b",
            "extra1",
            "extra2",
        ]);
        expect(result).toBeNull();
    });

    it("tolerates a single leftover token (returns a result)", () => {
        const result = getCommandValues(config, ["/repo", "b", "onlyOneExtra"]);
        expect(result).not.toBeNull();
    });
});
