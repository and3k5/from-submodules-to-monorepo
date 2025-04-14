interface ConsoleBase {
    log: typeof console.log;
}

interface ConsoleWrapperPart {
    contents: string[];
}

type ConsoleWrapper = ConsoleWrapperPart & ConsoleBase;
