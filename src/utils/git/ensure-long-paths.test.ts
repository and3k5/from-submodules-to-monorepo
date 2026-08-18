import { describe, it, expect, afterEach } from "vitest";
import { platform } from "os";
import { ensureLongPathsEnabled } from "./ensure-long-paths";
import {
    makeTempGitRepo,
    gitConfigOrUndefined,
    cleanupTempRepos,
} from "../../test/unit/git-repo";

const isWin = platform() === "win32";

describe("ensureLongPathsEnabled", () => {
    afterEach(() => cleanupTempRepos());

    it.runIf(isWin)("sets local core.longpaths=true on Windows", () => {
        const { dir } = makeTempGitRepo();
        expect(gitConfigOrUndefined(dir, "core.longpaths")).toBeUndefined();

        ensureLongPathsEnabled(dir);

        expect(gitConfigOrUndefined(dir, "core.longpaths")).toBe("true");
    });

    it.runIf(isWin)("is idempotent", () => {
        const { dir } = makeTempGitRepo();
        ensureLongPathsEnabled(dir);
        ensureLongPathsEnabled(dir);
        expect(gitConfigOrUndefined(dir, "core.longpaths")).toBe("true");
    });

    it.skipIf(isWin)("is a no-op on non-Windows platforms", () => {
        const { dir } = makeTempGitRepo();
        ensureLongPathsEnabled(dir);
        expect(gitConfigOrUndefined(dir, "core.longpaths")).toBeUndefined();
    });

    it("never throws for a non-existent directory (best-effort)", () => {
        expect(() =>
            ensureLongPathsEnabled("/definitely/not/a/repo/here"),
        ).not.toThrow();
    });
});
