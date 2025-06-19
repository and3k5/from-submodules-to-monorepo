import { resolve } from "path";
import { words } from "../lorem";
import { createFile } from "../utils/fs/create-file";
import { gitAdd } from "../utils/git/git-add";
import { gitCommit } from "../utils/git/git-commit";
import { capitalizeFirstLetter } from "../utils/string/capitalize-first-letter";
import { mkdirSync } from "fs";

export function makeRandomHistory(
    dir: string,
    gitOptions : { force: boolean, } | undefined,
    depth: number = 2,
    currentDepth: number = 0,
    indentation: string = ""
) {
    let l = 1 + Math.round(Math.random() * 2);
    console.log(indentation+"Creating " + l + " files");
    for (let i = 0; i < l; i++) {
        const fileName = randomFileName() + ".txt";
        console.log(indentation+"  Create file " + fileName);
        createFile(dir, fileName, words(150 + Math.round(Math.random() * 100)));
        if (gitOptions != null) {
            console.log(indentation+"    Stage");
            gitAdd(fileName, dir, gitOptions.force);
            console.log(indentation+"    Commit");
            gitCommit("Add " + fileName, dir);
        }
    }

    if (depth > 0) {
        l = 1 + Math.round(Math.random() * 2);
        console.log(indentation+"Creating " + l + " subdirs");
        for (let i = 0; i < l; i++) {
            const subDirName = randomFileName();
            const subDir = resolve(dir, subDirName);
            console.log(indentation+"  Create dir " + subDirName);
            mkdirSync(subDir);
            makeRandomHistory(subDir, gitOptions, depth - 1, currentDepth + 1, indentation+"    ");
        }
    }
}

function randomFileName() {
    return words(3)
        .split(" ")
        .map((x) => capitalizeFirstLetter(x))
        .join("");
}
