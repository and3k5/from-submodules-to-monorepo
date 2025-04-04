const { spawnSync } = require("child_process");

/**
 *
 * @type {typeof spawnSync}
 */
const run = function (...args) {
    const result = spawnSync(...args);
    if (result.error != null) {
        throw result.error;
    }
    if (result.status != 0) {
        let cmdTxt = args[0];
        if (args.length > 1) {
            cmdTxt += " " + args[1].join(" ");
        }

        const content = result.output
            .map((bf) => (bf != null ? bf.toString() : ""))
            .join("\n");
        const err = new Error(
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

module.exports.run = run;
