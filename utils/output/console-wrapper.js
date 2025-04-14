/**
 *
 * @returns {import("./console-wrapper").ConsoleWrapper}
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
