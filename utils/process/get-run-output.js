const { spawn } = require("child_process");

/**
 *
 * @param  {Parameters<typeof spawn>} args
 * @returns {Promise<string>}
 */
function getRunOutput(...args) {
    return new Promise((resolve, reject) => {
        let data = "";

        const proc = spawn(...args);

        proc.on("error", (err) => {
            reject(err);
        });

        proc.stdout.on("data", (d) => {
            data += d;
        });

        proc.on("close", (code) => {
            if (code != 0) {
                let cmdTxt = args[0];
                if (args.length > 1) {
                    cmdTxt += " " + args[1].join(" ");
                }

                const content = data;
                const err = new Error(
                    "Non zero exit: " +
                        code +
                        "\nfrom command: " +
                        cmdTxt +
                        "\n" +
                        content,
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

module.exports.getRunOutput = getRunOutput;
