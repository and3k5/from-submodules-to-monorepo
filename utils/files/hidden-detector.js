const { platform } = require("os");
const { getRunOutput } = require("../process/get-run-output");
const { normalize } = require("path");

function alignPathLayout(p) {
    return normalize(p).replaceAll("\\", "/").toUpperCase();
}

/**
 *
 * @param {string} basePath
 * @returns {Promise<(path : string) => boolean>}
 */
async function createHiddenDetector(basePath) {
    if (platform() == "win32") {
        const map = new Map();

        const content = (
            await getRunOutput("attrib", ["/S", "/D"], {
                cwd: basePath,
                encoding: "utf-8",
            })
        ).split("\n");
        content.push(
            await getRunOutput("attrib", ["/S", "/D", "."], {
                cwd: basePath,
                encoding: "utf-8",
            }),
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

        return (path) => {
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
    }

    return (path) => path.basename(path)[0] === ".";
}

module.exports.createHiddenDetector = createHiddenDetector;
