const { execFileSync } = require("child_process");
const { readFileSync, writeFileSync } = require("fs");

const output = execFileSync("npx", [".", "--help"], {
    encoding: "utf-8",
});

const readmeContent = readFileSync("README.md", { encoding: "utf-8" }).split(
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
        'Error: <div id="command-line-usage-begin"></div> not found in README.md',
    );
    process.exit(1);
}

if (endIndex === -1) {
    console.error(
        'Error: <div id="command-line-usage-end"></div> not found in README.md',
    );
    process.exit(1);
}

const beginReplacementIndex = beginIndex + 2;
const endReplacementIndex = endIndex - 1;

for (let i = beginReplacementIndex; i < endReplacementIndex; i++) {
    readmeContent.splice(beginReplacementIndex, 1);
}

readmeContent.splice(
    beginReplacementIndex,
    0,
    ...["```text", ...output.split("\n"), "```"],
);

writeFileSync("README.md", readmeContent.join("\n"), { encoding: "utf-8" });
console.log("README.md updated with command line usage.");
