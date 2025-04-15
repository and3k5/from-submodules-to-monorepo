import { cleanDirSync } from "./clean-dir";

export function cleanWithRetries(
    dir: string,
    exclude?: string[] | undefined,
    attempts: number = 3,
) {
    try {
        cleanDirSync(dir, exclude);
    } catch (e) {
        if ((e.code == "ENOTEMPTY" || e.code == "EBUSY") && attempts > 0) {
            console.log("  retrying clean dir");
            cleanWithRetries(dir, exclude, attempts - 1);
        } else {
            throw e;
        }
    }
}
