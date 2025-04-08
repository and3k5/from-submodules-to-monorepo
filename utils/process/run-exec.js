const { execFileSync } = require("child_process");

/**
 *
 * @type {typeof execFileSync}
 */
const runExec = function (...args) {
    const result = execFileSync(...args);
    // if (result.error != null) {
    //     throw result.error;
    // }
    // if (result.exitCode != 0) {
    //     let cmdTxt = args[0];
    //     if (args.length > 1) {
    //         cmdTxt += " " + args[1].join(" ");
    //     }

    //     const err = new Error(
    //         "Non zero exit: " +
    //             result.exitCode +
    //             "\nfrom command: " +
    //             cmdTxt,
    //     );
    //     err.status = result.status;
    //     err.pid = result.pid;

    //     throw err;
    // }
    return result;
};

module.exports.runExec = runExec;
