import { getBranches } from "./get-branches";

export function getMatchingBranch(
    path: string,
    branchNames: string | string[],
): string | undefined {
    const allBranches = getBranches(path)
        .filter((x) => x.startsWith("refs/heads/"))
        .map((x) => x.substring(11));
    if (!Array.isArray(branchNames)) {
        branchNames = [branchNames];
    }
    const matchingBranchName = allBranches.find((x) => branchNames.includes(x));
    return matchingBranchName;
}
