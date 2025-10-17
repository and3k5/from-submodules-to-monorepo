import { flattenTreeToList } from "../../transformation/create-tree-file";
import { FileTreeItem } from "../../utils/files/file-tree";

export function diff(beforeTree: FileTreeItem, afterTree: FileTreeItem) {
    const beforeList = flattenTreeToList(beforeTree, "/")!;
    const afterList = flattenTreeToList(afterTree, "/")!;

    const beforeSet = new Set(beforeList);
    const afterSet = new Set(afterList);

    const onlyInBefore = beforeList.filter((item) => !afterSet.has(item));
    const onlyInAfter = afterList.filter((item) => !beforeSet.has(item));

    console.error("[B] [A]");

    for (const path of onlyInBefore) {
        console.error(
            `[🟢] [🔴] Path ${path} existed before transformation but is gone!`,
        );
    }

    for (const path of onlyInAfter) {
        console.error(
            `[🔴] [🟢] Path ${path} did not exist before transformation but appeared after!`,
        );
    }
}
