import { describe, it, expect, afterEach } from "vitest";
import { platform } from "os";
import { checkoutModule } from "./checkoutModule";
import { createConsoleWrapper } from "../../utils/output/console-wrapper";
import {
    makeTempGitRepo,
    writeFile,
    commitAll,
    currentBranch,
    gitConfigOrUndefined,
    cleanupTempRepos,
} from "../../test/unit/git-repo";

const isWin = platform() === "win32";

describe("checkoutModule", () => {
    afterEach(() => cleanupTempRepos());

    const seededRepo = () => {
        const repo = makeTempGitRepo("mod");
        writeFile(repo.dir, "file.txt", "content");
        commitAll(repo.dir, "initial");
        return repo;
    };

    it("creates and checks out the migration branch", () => {
        const { dir } = seededRepo();
        checkoutModule(dir, "migration-branch", false, createConsoleWrapper());
        expect(currentBranch(dir)).toBe("migration-branch");
    });

    it("recreates the branch when deleteExistingBranches is true", () => {
        const { dir } = seededRepo();
        checkoutModule(dir, "migration-branch", false, createConsoleWrapper());
        // switch away so the branch can be deleted/recreated
        checkoutModule(dir, "other", false, createConsoleWrapper());
        expect(() =>
            checkoutModule(
                dir,
                "migration-branch",
                true,
                createConsoleWrapper(),
            ),
        ).not.toThrow();
        expect(currentBranch(dir)).toBe("migration-branch");
    });

    it.runIf(isWin)("enables local core.longpaths on Windows", () => {
        const { dir } = seededRepo();
        checkoutModule(dir, "migration-branch", false, createConsoleWrapper());
        expect(gitConfigOrUndefined(dir, "core.longpaths")).toBe("true");
    });
});
