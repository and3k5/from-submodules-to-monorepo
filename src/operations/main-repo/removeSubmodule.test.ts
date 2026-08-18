import { describe, it, expect, afterEach } from "vitest";
import { removeSubmodule } from "./removeSubmodule";
import { createConsoleWrapper } from "../../utils/output/console-wrapper";
import {
    makeTempGitRepo,
    writeFile,
    addIndexEntry,
    git,
    lsTree,
    cleanupTempRepos,
} from "../../test/unit/git-repo";

describe("removeSubmodule", () => {
    afterEach(() => cleanupTempRepos());

    it("rejects when the submodule has no path", async () => {
        const repo = makeTempGitRepo("main");
        await expect(
            removeSubmodule(repo.dir, {}, createConsoleWrapper()),
        ).rejects.toThrow("missing path for submodule");
    });

    it("removes the submodule gitlink and commits a 'Remove submodule' commit", async () => {
        const repo = makeTempGitRepo("main");
        writeFile(repo.dir, "keep.txt", "keep");
        writeFile(
            repo.dir,
            ".gitmodules",
            '[submodule "mymod"]\n\tpath = mymod\n\turl = ./mymod\n',
        );
        git(repo.dir, ["add", "keep.txt", ".gitmodules"]);
        addIndexEntry(
            repo.dir,
            "160000",
            "mymod",
            "1234567890123456789012345678901234567890",
        );
        git(repo.dir, ["commit", "-m", "initial with submodule"]);

        await removeSubmodule(
            repo.dir,
            { path: "mymod" },
            createConsoleWrapper(),
        );

        const entries = lsTree(repo.dir, "HEAD");
        expect(entries.some((e) => e.path === "mymod")).toBe(false);
        expect(entries.some((e) => e.path === "keep.txt")).toBe(true);

        const subject = git(repo.dir, ["log", "-1", "--format=%s"]).trim();
        expect(subject).toBe("Remove submodule: mymod");
    });
});
