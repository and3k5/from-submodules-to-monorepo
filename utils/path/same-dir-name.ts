import { platform } from "os";

export function sameDirName(nameA: string, nameB: string): boolean {
    switch (platform()) {
        case "win32":
            return nameA.toLowerCase() === nameB.toLowerCase();
        default:
            return nameA === nameB;
    }
}
