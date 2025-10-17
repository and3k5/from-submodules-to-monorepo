export function pullValue(args: string[]): string | undefined {
    if (args.length === 0) return undefined;
    const value = args[0];
    args.splice(0, 1);
    return value;
}
