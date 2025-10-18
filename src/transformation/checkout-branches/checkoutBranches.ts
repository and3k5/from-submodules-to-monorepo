import { ConsoleBase } from "../../utils/output/console-wrapper";
import { CheckoutBranchesOptions, checkoutBranch } from "./common";
import { runSubmoduleUpdatesAndCheckout } from "./runSubmoduleUpdatesAndCheckout";

export async function checkoutBranches(
    path: string,
    branchNames: string[] | string,
    options: CheckoutBranchesOptions,
    console: ConsoleBase,
    isSubmodule?: boolean | undefined,
): Promise<string[]> {
    console.log("Run queue for " + path);

    await checkoutBranch(
        path,
        branchNames,
        options,
        console,
        isSubmodule === true,
    );
    const checkoutBranchResult =
        "contents" in console && Array.isArray(console.contents)
            ? console.contents
            : [];

    const { noSubmoduleUpdate } = options;
    if (noSubmoduleUpdate) return checkoutBranchResult;

    const otherBranchResult = await runSubmoduleUpdatesAndCheckout(
        path,
        branchNames,
        options,
    );
    const lines = [checkoutBranchResult, otherBranchResult].flatMap((x) => x);
    return lines;
}
