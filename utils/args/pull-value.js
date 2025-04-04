/**
 *
 * @param {string[]} args
 * @param {string} key
 * @returns
 */
function pullValue(args) {
    if (args.length === 0) return undefined;
    const value = args[0];
    args.splice(0, 1);
    return value;
}

module.exports.pullValue = pullValue;
