import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { join } from "path";
import { getOriginNameForSubmodule } from "./origin-name-for-submodule";
import { ensureSameCaseForPath } from "../path/ensure-same-case-for-path";

describe("getOriginNameForSubmodule", () => {
    it("throws when the submodule has no path", () => {
        expect(() => getOriginNameForSubmodule("/main", {})).toThrow(
            "missing path for submodule",
        );
    });

    it("returns `<path>_<md5 of uppercased absolute path>`", () => {
        const mainRepoDir = join("/tmp", "some-main-repo");
        const submodule = { path: "myModule" };

        const result = getOriginNameForSubmodule(mainRepoDir, submodule);

        const expectedHash = crypto
            .createHash("md5")
            .update(
                ensureSameCaseForPath(
                    join(mainRepoDir, submodule.path),
                ).toUpperCase(),
            )
            .digest("hex");
        expect(result).toBe("myModule_" + expectedHash);
        expect(result.startsWith("myModule_")).toBe(true);
        expect(result.slice("myModule_".length)).toMatch(/^[0-9a-f]{32}$/);
    });

    it("is deterministic for the same inputs", () => {
        const a = getOriginNameForSubmodule("/main", { path: "m" });
        const b = getOriginNameForSubmodule("/main", { path: "m" });
        expect(a).toBe(b);
    });
});
