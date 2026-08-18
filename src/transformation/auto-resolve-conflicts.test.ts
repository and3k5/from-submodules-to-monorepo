import { describe, it, expect, afterEach } from "vitest";
import { autoResolveConflicts } from "./auto-resolve-conflicts";
import {
    makeTempGitRepo,
    writeFile,
    git,
    currentBranch,
    cleanupTempRepos,
} from "../test/unit/git-repo";

describe("autoResolveConflicts", () => {
    afterEach(() => cleanupTempRepos());

    it("returns false when the repo has no conflicts", async () => {
        const repo = makeTempGitRepo("clean");
        writeFile(repo.dir, "a.txt", "a");
        git(repo.dir, ["add", "a.txt"]);
        git(repo.dir, ["commit", "-m", "initial"]);

        expect(await autoResolveConflicts(repo.dir, true)).toBe(false);
    });

    it("re-adds the file for a modify/delete (UD) conflict and returns true", async () => {
        const repo = makeTempGitRepo("conflict");
        writeFile(repo.dir, "file.txt", "base");
        git(repo.dir, ["add", "file.txt"]);
        git(repo.dir, ["commit", "-m", "base"]);
        const base = currentBranch(repo.dir);

        // Branch that deletes the file (this becomes "them" in the merge).
        git(repo.dir, ["checkout", "-b", "deleter"]);
        git(repo.dir, ["rm", "file.txt"]);
        git(repo.dir, ["commit", "-m", "delete file"]);

        // Back on the base branch, modify the file ("us"), then merge the deletion.
        git(repo.dir, ["checkout", base]);
        writeFile(repo.dir, "file.txt", "modified");
        git(repo.dir, ["add", "file.txt"]);
        git(repo.dir, ["commit", "-m", "modify file"]);
        try {
            git(repo.dir, ["merge", "deleter"]); // conflicts -> non-zero exit
        } catch {
            // expected: modify/delete conflict
        }

        const result = await autoResolveConflicts(repo.dir, true);

        expect(result).toBe(true);
        // No unmerged entries remain and the file is staged again.
        const status = git(repo.dir, ["status", "--porcelain=v2"]);
        expect(status.split("\n").some((l) => l.startsWith("u "))).toBe(false);
        expect(git(repo.dir, ["ls-files", "file.txt"]).trim()).toBe("file.txt");
    });
});
