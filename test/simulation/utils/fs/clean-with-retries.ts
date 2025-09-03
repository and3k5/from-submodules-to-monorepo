import { cleanDirSync } from "./clean-dir";

export function cleanWithRetries(
    dir: string,
    exclude?: string[] | undefined,
    attempts: number = 3,
) {
    try {
        cleanDirSync(dir, exclude);
        console.log("    done!");
    } catch (e) {
        if ((e.code == "ENOTEMPTY" || e.code == "EBUSY") && attempts > 0) {
            console.log("    retrying ...");
            cleanWithRetries(dir, exclude, attempts - 1);
        } else {
            throw e;
        }
    }
}
