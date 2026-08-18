import { execFileSync } from "child_process";
import { platform } from "os";

/**
 * Enables git's long-path support (`core.longpaths=true`) in the *local* (repo) scope so the
 * caller never has to configure it globally/manually before running.
 *
 * On Windows the default 260-char MAX_PATH limit makes `git checkout`, `git clean -fdx` and
 * `git mv`/merge fail on the deep paths this tool produces (a submodule's contents get nested one
 * level deeper under a same-named subdirectory, which pushes long paths over the limit). Setting
 * `core.longpaths=true` makes git use the `\\?\` extended-length prefix and bypass MAX_PATH.
 *
 * Behaviour:
 * - Windows only — on other platforms `core.longpaths` is a no-op in git, so this returns early.
 * - Repo-scoped (`--local`) — no global config is touched.
 * - Idempotent and best-effort — a failure here must never abort the migration.
 * - Set-and-leave — the resulting repo genuinely contains long paths, so the setting is left in
 *   place (unsetting it would just reintroduce the failures for later git operations).
 * @param repoDir
 */
export function ensureLongPathsEnabled(repoDir: string): void {
    if (platform() !== "win32") {
        return;
    }
    try {
        execFileSync("git", ["config", "--local", "core.longpaths", "true"], {
            cwd: repoDir,
            stdio: "ignore",
        });
    } catch {
        // Best-effort: never block the migration on failing to set this.
    }
}
