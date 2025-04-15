import { writeFileSync } from "fs";
import { join } from "path";

export function createFile(dir : string, filename : string, content : string) {
    writeFileSync(join(dir, filename), content, { encoding: "utf8" });
}
