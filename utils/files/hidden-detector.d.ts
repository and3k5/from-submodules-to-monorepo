interface HiddenDetector {
    (path : string): boolean;
    getMap() : Map<string, string[]> | undefined;
}