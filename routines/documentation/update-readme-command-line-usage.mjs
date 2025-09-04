import { execFileSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import {
    ansiCodesCssColors,
    reverseAnsiCode,
} from "../../utils/output/colors.mjs";

const output = execFileSync("npx", [".", "--help", "--enable-colors"], {
    encoding: "utf-8",
});

const readmeContent = readFileSync("USAGE.md", { encoding: "utf-8" }).split(
    "\n",
);

const beginIndex = readmeContent
    .map((x) => x.trim())
    .indexOf(`<div id="command-line-usage-begin"></div>`);
const endIndex = readmeContent
    .map((x) => x.trim())
    .indexOf(`<div id="command-line-usage-end"></div>`);

if (beginIndex === -1) {
    console.error(
        'Error: <div id="command-line-usage-begin"></div> not found in USAGE.md',
    );
    process.exit(1);
}

if (endIndex === -1) {
    console.error(
        'Error: <div id="command-line-usage-end"></div> not found in USAGE.md',
    );
    process.exit(1);
}

const beginReplacementIndex = beginIndex + 2;
const endReplacementIndex = endIndex - 1;

for (let i = beginReplacementIndex; i < endReplacementIndex; i++) {
    readmeContent.splice(beginReplacementIndex, 1);
}

function ansiKeyToCss(ansiKey) {
    if (ansiKey === "reset") {
        return "color: inherit; background-color: inherit;";
    }
    const [type, key] = ansiKey.split(":");
    if (type === "fg") {
        return `color: ${ansiCodesCssColors[key]};`;
    } else if (type === "bg") {
        return `background-color: ${ansiCodesCssColors[key]};`;
    } else {
        return "unknown:" + ansiKey;
    }
}

const escapeHtml = (unsafe) => {
    return unsafe
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
};

readmeContent.splice(
    beginReplacementIndex,
    0,
    "<pre>",
    ...ansiToHtml(output).split("\n"),
    "</pre>",
);

/**
 * @description Converts a string with ANSI codes into HTML.
 * @param {string} ansiString - The string containing ANSI codes.
 * @returns {string} - The resulting HTML string.
 */
function ansiToHtml(ansiString) {
    // eslint-disable-next-line no-control-regex
    const ansiRegex = /^(\x1b\[[0-9;]*m)/g;

    let html = "";
    let leftOver = ansiString;

    let depth = 0;

    while (leftOver.length > 0) {
        if (ansiRegex.test(leftOver)) {
            const match = leftOver.match(ansiRegex);
            leftOver = leftOver.replace(ansiRegex, "");
            const ansiKey = reverseAnsiCode(match[0]);
            if (ansiKey === "reset") {
                html += "</code>";
                depth--;
                continue;
            }
            const css = ansiKeyToCss(ansiKey);
            if (css !== "") {
                while (depth > 0) {
                    depth--;
                    html += "</code>";
                }
                depth++;
                html += `<code style="${css}">`;
            }
        } else {
            html += escapeHtml(leftOver[0]);
            leftOver = leftOver.substring(1);
        }
    }

    while (depth > 0) {
        depth--;
        html += "</code>";
    }

    return html;
}

writeFileSync("USAGE.md", readmeContent.join("\n"), { encoding: "utf-8" });
console.log("USAGE.md updated with command line usage.");
