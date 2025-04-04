/**
 *
 * @param {string[]} args
 * @param {string} key
 * @returns {boolean}
 */
function pullFlag(args, key) {
    const index = args.indexOf(key);
    if (index == -1) return false;
    args.splice(index, 1);
    return true;
}

module.exports.pullFlag = pullFlag;
