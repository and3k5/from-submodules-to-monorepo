import { describe, it, expect, afterEach } from "vitest";
import { moveFiles } from "./moveFiles";
import { createConsoleWrapper } from "../../utils/output/console-wrapper";
import {
    makeTempGitRepo,
    writeFile,
    addIndexEntry,
    git,
    lsTree,
    cleanupTempRepos,
} from "../../test/unit/git-repo";

describe("moveFiles", () => {
    afterEach(() => cleanupTempRepos());

    /**
     * Builds a submodule repo named "mymod" whose HEAD contains a spread of entry shapes that the
     * old `git mv`-based implementation could not handle, then relocates everything under `mymod/`.
     */
    it("relocates every tracked entry under <name>/ preserving modes, via read-tree", () => {
        const repo = makeTempGitRepo("mymod");

        // Regular working-tree files, one inside a top-level dir sharing the submodule name.
        writeFile(repo.dir, "root.txt", "root");
        writeFile(repo.dir, "mymod/inner.txt", "inner"); // collision: -> mymod/mymod/inner.txt
        git(repo.dir, ["add", "root.txt", "mymod/inner.txt"]);

        // Special entries added purely via plumbing (no real symlink / submodule / on-disk file):
        addIndexEntry(repo.dir, "100755", "script.sh", "#!/bin/sh\necho hi\n");
        addIndexEntry(repo.dir, "120000", "link", "root.txt"); // symlink-to-file entry
        addIndexEntry(
            repo.dir,
            "160000",
            "nested-sub",
            "1234567890123456789012345678901234567890",
        ); // gitlink
        // Tracked but absent from the working tree (the OdendoAdmin skip-worktree shape):
        addIndexEntry(repo.dir, "100644", "generated.bin", "generated");

        git(repo.dir, ["commit", "-m", "initial"]);

        moveFiles(
            repo.parent,
            repo.dir,
            { path: "mymod" },
            createConsoleWrapper(),
        );

        const entries = lsTree(repo.dir, "HEAD");
        const byPath = Object.fromEntries(entries.map((e) => [e.path, e]));

        // Everything now lives under the mymod/ prefix.
        expect(entries.length).toBeGreaterThan(0);
        expect(entries.every((e) => e.path.startsWith("mymod/"))).toBe(true);

        // Regular files, including the same-name collision folded to mymod/mymod/...
        expect(byPath["mymod/root.txt"]).toBeTruthy();
        expect(byPath["mymod/mymod/inner.txt"]).toBeTruthy();

        // Modes preserved exactly.
        expect(byPath["mymod/script.sh"].mode).toBe("100755");
        expect(byPath["mymod/link"].mode).toBe("120000");
        expect(byPath["mymod/nested-sub"].mode).toBe("160000");
        expect(byPath["mymod/nested-sub"].type).toBe("commit");

        // Tracked-but-absent file relocated too (working tree is irrelevant to read-tree).
        expect(byPath["mymod/generated.bin"]).toBeTruthy();
    });

    it("creates a 'Moving submodule files' commit on top of the previous HEAD", () => {
        const repo = makeTempGitRepo("mymod");
        writeFile(repo.dir, "a.txt", "a");
        git(repo.dir, ["add", "a.txt"]);
        git(repo.dir, ["commit", "-m", "initial"]);
        const before = git(repo.dir, ["rev-parse", "HEAD"]).trim();

        moveFiles(
            repo.parent,
            repo.dir,
            { path: "mymod" },
            createConsoleWrapper(),
        );

        const subject = git(repo.dir, ["log", "-1", "--format=%s"]).trim();
        const parent = git(repo.dir, ["rev-parse", "HEAD~1"]).trim();
        expect(subject).toBe("Moving submodule files");
        expect(parent).toBe(before);
    });
});
