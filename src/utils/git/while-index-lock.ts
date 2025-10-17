import { existsSync } from "fs";
import { join } from "path";

export function wait(n: number) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(void 0);
        }, n);
    });
}

export async function whileIndexLock(repoPath) {
    const lockFilePath = join(repoPath, ".git", "index.lock");

    let attempts = 0;
    if (existsSync(lockFilePath)) {
        console.log(
            `Git index is locked in ${repoPath}. Waiting for it to be released...`,
        );
        while (existsSync(lockFilePath)) {
            // Wait until the lock file is removed
            attempts++;
            await wait(100);
            if (attempts > 30) {
                throw new Error(
                    "Timeout waiting for git index lock to be released for repo: " +
                        repoPath,
                );
            }
        }
        console.log("Index lock removed");
    }
}
