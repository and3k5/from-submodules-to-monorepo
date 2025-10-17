import { readFileSync } from "fs";

export interface Submodule {
    /** The path of the submodule.*/
    path?: string;
    /** The URL of the submodule.*/
    url?: string;
}

export function readGitmodules(filePath: string): Submodule[] {
    const content = readFileSync(filePath, "utf-8");
    const submodules: Submodule[] = [];
    const lines = content.split("\n");
    let currentSubmodule: Partial<Submodule> | null = null;

    lines.forEach((line) => {
        line = line.trim();
        if (line.startsWith("[submodule")) {
            if (currentSubmodule) {
                submodules.push(currentSubmodule);
            }
            currentSubmodule = {};
        } else if (currentSubmodule) {
            const [key, value] = line.split("=").map((s) => s.trim());
            currentSubmodule[key] = value;
        }
    });

    if (currentSubmodule) {
        submodules.push(currentSubmodule);
    }

    return submodules;
}
