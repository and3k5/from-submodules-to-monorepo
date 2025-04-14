/** @typedef {Object} ConsoleBase
 * @property {typeof console.log} log
 */

/**
 * @typedef {Object} ConsoleWrapperPart
 * @property {string[]} contents
 */

/**
 * @typedef {ConsoleWrapperPart & ConsoleBase} ConsoleWrapper
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
