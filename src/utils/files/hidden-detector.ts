import { platform } from "os";
import { getRunOutputBuffer } from "../process/get-run-output";
import { normalize, basename } from "path";
import { createConfig } from "../args/command-config";
import { getCommandValues } from "../args/command-config";

export function alignPathLayout(p) {
    return normalize(p).replaceAll("\\", "/").toUpperCase();
}

/**
 * Runs Windows `attrib` and decodes its output correctly.
 *
 * When `attrib`'s stdout is redirected to a pipe (as here) it writes paths in the Windows ANSI
 * code page — cp1252 on Western/Danish systems — NOT UTF-8 and NOT the OEM console page (`chcp`
 * has no effect on it). Decoding those bytes as UTF-8 turns non-ASCII filenames (ø/æ/å) into
 * replacement characters, so the lookup keys never match the real Unicode names the filesystem
 * reports. We therefore capture the raw bytes and decode them as windows-1252.
 * @param basePath
 * @param args
 */
async function runAttrib(basePath: string, args: string[]): Promise<string> {
    const buffer = await getRunOutputBuffer("attrib", args, { cwd: basePath });
    return new TextDecoder("windows-1252").decode(buffer);
}

interface HiddenDetector {
    (path: string): boolean;
    getMap?(): Map<string, string[]> | undefined;
}

export async function createHiddenDetector(
    basePath: string,
): Promise<HiddenDetector> {
    if (platform() == "win32") {
        const map = new Map();

        const content = (await runAttrib(basePath, ["/S", "/D"]))
            .split("\n")
            .filter((x) => x.trim() !== "");
        content.push(
            ...(await runAttrib(basePath, ["/S", "/D", "."]))
                .split("\n")
                .filter((x) => x.trim() !== ""),
        );
        const attributes = content.map((line) => {
            return {
                attributes: line
                    .slice(0, 21)
                    .split("")
                    .filter((x) => x.trim() !== ""),
                path: alignPathLayout(line.slice(21).trim()),
            };
        });
        for (const attribute of attributes) {
            map.set(attribute.path, attribute.attributes);
        }

        const method = (path) => {
            const mapOut = map.get(alignPathLayout(path));
            if (!mapOut) {
                // attrib didn't report this path. Treat it as not-hidden and warn, rather than
                // aborting the whole migration — hidden detection only feeds the optional
                // report/tree snapshot, so a stray miss must not be fatal.
                console.error(
                    "Warning: attrib returned no attributes for " +
                        alignPathLayout(path) +
                        " basePath(" +
                        basePath +
                        "); treating as not hidden",
                );
                return false;
            }
            return mapOut.includes("H");
        };
        method.getMap = () => map;
        return method;
    }

    return (path) => basename(path)[0] === ".";
}

if (import.meta.main) {
    const argsConfig = createConfig({
        flags: {
            outputAllEntries: {
                identifier: "--output-all-entries",
                description: "Output all entries in the map",
            },
        },
        values: {
            basePath: {
                identifier: "base-path",
                description: "Base path to search for hidden files",
                required: true,
            },
            lookUpPath: {
                identifier: "look-up-path",
                description: "The path to check hidden status",
            },
        },
    });

    const args = getCommandValues(argsConfig, process.argv.slice(2));

    if (args == null) {
        throw new Error("Invalid args");
    }

    if (args.values.basePath == null) {
        console.error("Base path is required");
        process.exit(1);
    }
    if (args.values.lookUpPath == null && !args.flags.outputAllEntries) {
        console.error("Look up path is required");
        process.exit(1);
    }

    createHiddenDetector(args.values.basePath).then((detector) => {
        if (args.values.lookUpPath != null) {
            const isHidden = detector(args.values.lookUpPath);
            console.log(isHidden);
        } else if (args.flags.outputAllEntries) {
            if (detector.getMap) {
                const map = detector.getMap();
                if (map) {
                    console.log(Array.from(map.entries()));
                }
            }
        }
    });
}
