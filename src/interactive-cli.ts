import { createInterface } from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { basename, resolve } from "path";
import { existsSync } from "fs";
import { ansiCodes as c } from "./utils/output/colors";
import { performTransformation } from "./index";

const defaultMigrationBranchName = "from-submodules-to-monorepo";

interface InteractiveOptions {
    useColors: boolean;
}

export async function runInteractiveCli({
    useColors,
}: InteractiveOptions): Promise<void> {
    const col = (code: string) => (useColors ? code : "");
    const RESET = col(c.reset);
    const CYAN = col(c.fg.cyan);
    const YELLOW = col(c.fg.yellow);
    const GREEN = col(c.fg.green);
    const WHITE = col(c.fg.white);
    const RED = col(c.fg.red);

    const rl = createInterface({ input, output });

    const ask = async (prompt: string): Promise<string> => {
        return (await rl.question(prompt)).trim();
    };

    const askYesNo = async (
        prompt: string,
        defaultYes: boolean,
    ): Promise<boolean> => {
        const hint = defaultYes ? "[Y/n]" : "[y/N]";
        const answer = await ask(`${prompt} ${CYAN}${hint}${RESET}: `);
        if (answer === "") return defaultYes;
        return answer.toLowerCase() === "y";
    };

    const step = (n: number, total: number, title: string) => {
        console.log("");
        console.log(`${YELLOW}→ Step ${n} of ${total}: ${title}${RESET}`);
    };

    console.log("");
    console.log(`${WHITE}from-submodules-to-monorepo${RESET}`);
    console.log(`${GREEN}Interactive setup${RESET}`);
    console.log("");
    console.log("Transforms a git repository with submodules into a monorepo,");
    console.log("preserving full commit history for every submodule.");

    // Step 1: Repo directory
    step(1, 5, "Repository");
    let mainRepoDir = "";
    while (true) {
        mainRepoDir = resolve(await ask(`  ${WHITE}Repo directory${RESET}: `));
        if (!existsSync(mainRepoDir)) {
            console.log(
                `  ${RED}Directory does not exist: ${mainRepoDir}${RESET}`,
            );
            continue;
        }
        if (!existsSync(`${mainRepoDir}/.gitmodules`)) {
            console.log(
                `  ${RED}No .gitmodules found in ${mainRepoDir}${RESET}`,
            );
            continue;
        }
        break;
    }

    // Step 2: Migration branch
    step(2, 5, "Migration branch");
    const branchInput = await ask(
        `  ${WHITE}Branch name${RESET} ${CYAN}[${defaultMigrationBranchName}]${RESET}: `,
    );
    const migrationBranchName =
        branchInput === "" ? defaultMigrationBranchName : branchInput;

    // Step 3: Options
    step(3, 5, "Options");
    const resetWithMasterOrMainBranches = await askYesNo(
        `  Reset all submodules to master/main branch first?`,
        false,
    );
    const deleteExistingBranches = await askYesNo(
        `  Delete existing migration branches?`,
        false,
    );
    const keepUntrackedFiles = await askYesNo(
        `  Keep untracked files? (archives and restores them)`,
        true,
    );
    const createReport = await askYesNo(
        `  Create a before/after report?`,
        true,
    );
    const pullRemotes = await askYesNo(`  Pull from remotes?`, false);
    const noThreads = await askYesNo(`    Disable parallelism?`, false);
    let nukeRemote = false;
    if (pullRemotes) {
        if (!noThreads) {
            nukeRemote = await askYesNo(`    Use nuke-remote mode?`, false);
        }
    }

    // Step 4: Acknowledge risks
    step(4, 5, "Acknowledge risks");
    console.log("");
    console.log(`  ${RED}⚠  WARNING ⚠${RESET}`);
    console.log("");
    console.log(
        "  This tool is highly experimental and may cause irreversible damage,",
    );
    console.log(
        "  including but not limited to data loss, corruption of repositories,",
    );
    console.log("  or deletion of your entire project.");
    console.log("  Use it at your own risk.");
    console.log("  Always ensure you have proper backups before proceeding.");
    console.log("");
    const folderName = basename(mainRepoDir);
    let confirmed = false;
    while (!confirmed) {
        const typed = await ask(
            `  Type ${YELLOW}${folderName}${RESET} to confirm you accept the risks: `,
        );
        if (typed === folderName) {
            confirmed = true;
        } else {
            console.log(`  ${RED}Incorrect. Expected: ${folderName}${RESET}`);
        }
    }

    // Step 5: Summary
    step(5, 5, "Summary");
    console.log("");
    console.log(`  ${WHITE}Repo:${RESET}                  ${mainRepoDir}`);
    console.log(
        `  ${WHITE}Branch:${RESET}                ${migrationBranchName}`,
    );
    console.log(
        `  ${WHITE}Reset to master/main:${RESET}  ${resetWithMasterOrMainBranches ? "yes" : "no"}`,
    );
    console.log(
        `  ${WHITE}Delete existing branches:${RESET} ${deleteExistingBranches ? "yes" : "no"}`,
    );
    console.log(
        `  ${WHITE}Keep untracked files:${RESET}  ${keepUntrackedFiles ? "yes" : "no"}`,
    );
    console.log(
        `  ${WHITE}Create report:${RESET}         ${createReport ? "yes" : "no"}`,
    );
    if (pullRemotes) {
        console.log(`  ${WHITE}Pull remotes:${RESET}          yes`);
        console.log(
            `  ${WHITE}No threads:${RESET}            ${noThreads ? "yes" : "no"}`,
        );
        console.log(
            `  ${WHITE}Nuke remote:${RESET}           ${nukeRemote ? "yes" : "no"}`,
        );
    }
    console.log("");
    await ask(
        `  Press ${GREEN}Enter${RESET} to start, or ${RED}Ctrl+C${RESET} to abort `,
    );

    rl.close();

    await performTransformation(mainRepoDir, {
        migrationBranchName,
        resetWithMasterOrMainBranches,
        deleteExistingBranches,
        noThreads,
        pullRemotes,
        nukeRemote,
        createReport,
        keepUntrackedFiles,
    });
}
