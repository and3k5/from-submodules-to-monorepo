export const ansiCodes = {
    fg: {
        black: "\x1b[30m",
        red: "\x1b[31m",
        green: "\x1b[32m",
        yellow: "\x1b[33m",
        blue: "\x1b[34m",
        magenta: "\x1b[35m",
        cyan: "\x1b[36m",
        white: "\x1b[37m",
    },
    bg: {
        black: "\x1b[40m",
        red: "\x1b[41m",
        green: "\x1b[42m",
        yellow: "\x1b[43m",
        blue: "\x1b[44m",
        magenta: "\x1b[45m",
        cyan: "\x1b[46m",
        white: "\x1b[47m",
    },
    reset: "\x1B[0m",
};

export const ansiCodesCssColors = {
    black: "rgb(0, 0, 0)",
    red: "rgb(204, 0, 0)",
    green: "rgb(0, 204, 0)",
    yellow: "rgb(204, 204, 0)",
    blue: "rgb(0, 0, 204)",
    magenta: "rgb(204, 0, 204)",
    cyan: "rgb(0, 204, 204)",
    white: "rgb(204, 204, 204)",
};

export function reverseAnsiCode(ansiCode) {
    if (ansiCode === ansiCodes.reset) {
        return "reset";
    }
    const fgMatch = Object.keys(ansiCodes.fg).find(
        (key) => ansiCodes.fg[key] === ansiCode,
    );
    if (fgMatch) {
        return "fg:" + fgMatch;
    }
    const bgMatch = Object.keys(ansiCodes.bg).find(
        (key) => ansiCodes.bg[key] === ansiCode,
    );
    if (bgMatch) {
        return "bg:" + bgMatch;
    } else {
        return undefined;
    }
}
