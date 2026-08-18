import { describe, it, expect, afterEach } from "vitest";
import { existsSync, mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { list } from "tar";
import { archiveUntrackedFiles } from "./archiveUntrackedFiles";
import { createConsoleWrapper } from "../../utils/output/console-wrapper";
import {
    makeTempGitRepo,
    writeFile,
    commitAll,
    cleanupTempRepos,
} from "../../test/unit/git-repo";

describe("archiveUntrackedFiles", () => {
    const keepDirs: string[] = [];
    const makeKeepDir = () => {
        const d = mkdtempSync(join(tmpdir(), "keep-untracked-"));
        keepDirs.push(d);
        return d;
    };
    afterEach(() => {
        cleanupTempRepos();
        for (const d of keepDirs.splice(0))
            rmSync(d, { recursive: true, force: true });
    });

    it("archives untracked files (forward-slash, prefixed) then removes them", async () => {
        // repo.parent acts as the main repo root; repo.dir is the submodule at <root>/mymod.
        const repo = makeTempGitRepo("mymod");
        writeFile(repo.dir, "tracked.txt", "t");
        commitAll(repo.dir, "initial");
        writeFile(repo.dir, "untracked.txt", "u");
        writeFile(repo.dir, "sub/nested.txt", "n");

        const keepDir = makeKeepDir();
        await archiveUntrackedFiles(
            repo.parent,
            repo.dir,
            { path: "mymod" },
            keepDir,
            createConsoleWrapper(),
        );

        const archivePath = join(keepDir, "mymod.tar.gz");
        expect(existsSync(archivePath)).toBe(true);

        // Untracked files were cleaned from the working tree.
        expect(existsSync(join(repo.dir, "untracked.txt"))).toBe(false);
        expect(existsSync(join(repo.dir, "sub"))).toBe(false);
        // Tracked file remains.
        expect(existsSync(join(repo.dir, "tracked.txt"))).toBe(true);

        // Entries are rooted at the submodule name with forward slashes.
        const paths: string[] = [];
        await list({
            file: archivePath,
            onReadEntry: (e) => paths.push(e.path),
        });
        expect(paths).toContain("mymod/untracked.txt");
        expect(paths).toContain("mymod/sub/nested.txt");
        expect(paths.every((p) => !p.includes("\\"))).toBe(true);
    });

    it("does nothing and creates no archive when there are no untracked files", async () => {
        const repo = makeTempGitRepo("mymod");
        writeFile(repo.dir, "tracked.txt", "t");
        commitAll(repo.dir, "initial");

        const keepDir = makeKeepDir();
        const wrapper = createConsoleWrapper();
        await archiveUntrackedFiles(
            repo.parent,
            repo.dir,
            { path: "mymod" },
            keepDir,
            wrapper,
        );

        expect(existsSync(join(keepDir, "mymod.tar.gz"))).toBe(false);
        expect(wrapper.contents.join("\n")).toContain(
            "No untracked files to archive",
        );
    });
});
