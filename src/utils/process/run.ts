import { spawnSync } from "child_process";

export const run = (...args: Parameters<typeof spawnSync>) => {
    const result = spawnSync(...args);
    if (result.error != null) {
        throw result.error;
    }
    if (result.status != 0) {
        let cmdTxt = args[0];
        if (args.length > 1) {
            cmdTxt += " " + args[1]?.join(" ");
        }

        const content = result.output
            .map((bf) => (bf != null ? bf.toString() : ""))
            .join("\n");
        const err: Error & {
            status?: number | null | undefined;
            pid?: number | null | undefined;
        } = new Error(
            "Non zero exit: " +
                result.status +
                "\nfrom command: " +
                cmdTxt +
                "\n" +
                content,
        );
        err.status = result.status;
        err.pid = result.pid;

        throw err;
    }
    return result;
};
