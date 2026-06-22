import { execFileSync } from "child_process";

interface RegisteredRemote {
    repoDir: string;
    remoteName: string;
}

const registry: RegisteredRemote[] = [];

export function registerRemote(repoDir: string, remoteName: string): void {
    registry.push({ repoDir, remoteName });
}

export function removeAllRegisteredRemotes(): void {
    for (const { repoDir, remoteName } of registry) {
        try {
            execFileSync("git", ["remote", "remove", remoteName], {
                stdio: "ignore",
                cwd: repoDir,
            });
        } catch {
            // remote may already be gone
        }
    }
    registry.length = 0;
}
