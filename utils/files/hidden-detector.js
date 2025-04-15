const { platform } = require("os");
const { getRunOutput } = require("../process/get-run-output");
const { normalize, basename } = require("path");
const { createConfig } = require("../args/command-config");
const { getCommandValues } = require("../args/command-config");

function alignPathLayout(p) {
    return normalize(p).replaceAll("\\", "/").toUpperCase();
}

/**
 *
 * @param {string} basePath
 * @returns {Promise<HiddenDetector>}
 */
async function createHiddenDetector(basePath) {
    if (platform() == "win32") {
        const map = new Map();

        const content = (
            await getRunOutput("attrib", ["/S", "/D"], {
                cwd: basePath,
                encoding: "utf-8",
            })
        )
            .split("\n")
            .filter((x) => x.trim() !== "");
        content.push(
            ...(
                await getRunOutput("attrib", ["/S", "/D", "."], {
                    cwd: basePath,
                    encoding: "utf-8",
                })
            )
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
            if (!mapOut)
                throw new Error(
                    "Attrib did not return values for " +
                        alignPathLayout(path) +
                        " basePath(" +
                        basePath +
                        ")",
                );
            return mapOut.includes("H");
        };
        method.getMap = () => map;
        return method;
    }

    return (path) => basename(path)[0] === ".";
}

if (module.id === ".") {
    const argsConfig = createConfig({
        flags: {
            outputAllEntries: {
                identifier: "--output-all-entries",
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
            const map = detector.getMap();
            console.log(Array.from(map.entries()));
        }
    });
} else {
    module.exports.createHiddenDetector = createHiddenDetector;
}
