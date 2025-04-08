/** @typedef {Object} ConsoleBase
 * @property {typeof console.log} log
 */

/**
 * @typedef {Object} ConsoleWrapper
 * @extends {ConsoleBase}
 * @property {string[]} contents
 */

/**
 *
 * @returns {ConsoleWrapper}
 */
function createConsoleWrapper() {
    const contents = [];
    return {
        log: (...args) => {
            contents.push(args.join(" "));
        },
        contents: contents,
    };
}

module.exports.createConsoleWrapper = createConsoleWrapper;
