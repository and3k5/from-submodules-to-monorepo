export function createConsoleWrapper(): ConsoleWrapper {
    const contents: ConsoleWrapper["contents"] = [];
    return {
        log: (...args) => {
            contents.push(args.join(" "));
        },
        contents: contents,
    };
}

export interface ConsoleBase {
    log: typeof console.log;
}

interface ConsoleWrapperPart {
    contents: string[];
}

export type ConsoleWrapper = ConsoleWrapperPart & ConsoleBase;
