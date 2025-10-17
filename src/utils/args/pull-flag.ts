export function pullFlag(args: string[], key: string): boolean {
    const index = args.indexOf(key);
    if (index == -1) return false;
    args.splice(index, 1);
    return true;
}
