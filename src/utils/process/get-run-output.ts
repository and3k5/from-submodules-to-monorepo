import { spawn } from "child_process";

/**
 * Runs a command and resolves with its raw stdout bytes (streamed, so there is no maxBuffer
 * limit). Rejects with an Error carrying `status`/`pid` on non-zero exit or spawn error.
 * Collecting Buffers and concatenating once avoids corrupting multi-byte sequences that straddle
 * chunk boundaries, and lets callers decode with whatever encoding the program actually emits.
 * @param {...any} args
 */
export function getRunOutputBuffer(
    ...args: Parameters<typeof spawn>
): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];

        const proc = spawn(...args);

        proc.on("error", (err) => {
            reject(err);
        });

        proc.stdout!.on("data", (d) => {
            chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d));
        });

        proc.on("close", (code) => {
            const data = Buffer.concat(chunks);
            if (code != 0) {
                let cmdTxt = args[0];
                if (args.length > 1) {
                    cmdTxt += " " + args[1].join(" ");
                }

                const err: Error & {
                    status?: number | null | undefined;
                    pid?: number | null | undefined;
                } = new Error(
                    "Non zero exit: " +
                        code +
                        "\nfrom command: " +
                        cmdTxt +
                        "\n" +
                        data.toString("utf8"),
                );
                err.status = code;
                err.pid = proc.pid;

                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

/**
 * Runs a command and resolves with its stdout decoded as UTF-8.
 * @param {...any} args
 */
export function getRunOutput(
    ...args: Parameters<typeof spawn>
): Promise<string> {
    return getRunOutputBuffer(...args).then((buf) => buf.toString("utf8"));
}
