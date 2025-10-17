import { ansiCodes as c } from "../output/colors";
import { CommandUsageConfig } from "./command-config";

export function prettyFormatCommandUsage<
    TFlagKey extends string[],
    TValueKey extends string[],
>(
    fileName: string,
    configuration: CommandUsageConfig<TFlagKey, TValueKey>,
    addColors: boolean = false,
): string {
    const result: string[] = [];
    const flags = configuration.flags;
    const col = (c: string) => (addColors ? c : "");
    const CYAN = col(c.fg.cyan);
    const RESET = col(c.reset);
    const YELLOW = col(c.fg.yellow);
    const GREEN = col(c.fg.green);
    const BLUE = col(c.fg.blue);
    const WHITE = col(c.fg.white);

    result.push(`${WHITE}Usage:${RESET}`);
    let commandLine = `${BLUE}${fileName}${RESET}`;
    if (flags != null && Object.keys(flags).length > 0) {
        commandLine += ` ${CYAN}<${RESET}${YELLOW}OPTIONS${RESET}${CYAN}>${RESET}`;
    }
    if (
        configuration.values != null &&
        Object.keys(configuration.values).length > 0
    ) {
        for (const valueKey in configuration.values) {
            if (!Object.hasOwnProperty.call(configuration.values, valueKey))
                continue;
            const value = configuration.values[valueKey];
            if (value == null) continue;
            if (value.customNotation === "multiple-values-comma-separated") {
                commandLine += ` ${CYAN}<${RESET}${YELLOW}${value.identifier}${RESET}${CYAN}>[,<${RESET}${YELLOW}${value.identifier}${RESET}${CYAN}>,...]${RESET}`;
            } else {
                if (value.required === true) {
                    commandLine += ` ${CYAN}<${RESET}${YELLOW}${value.identifier}${RESET}${CYAN}>${RESET}`;
                } else {
                    commandLine += ` ${CYAN}[${RESET}${YELLOW}<${value.identifier}${RESET}${CYAN}>]${RESET}`;
                }
            }
        }
    }
    result.push(commandLine);

    if (
        configuration.values != null &&
        Object.keys(configuration.values).length > 0
    ) {
        result.push(`    ${WHITE}Values:${RESET}`);
        for (const valueKey in configuration.values) {
            if (!Object.hasOwnProperty.call(configuration.values, valueKey))
                continue;
            const value = configuration.values[valueKey];
            if (value == null) continue;
            result.push(`        ${YELLOW}${value.identifier}${RESET}`);
            result.push(
                `            ${GREEN}${value.description.replaceAll("\n", "\n            ")}${RESET}`,
            );
            if (value.required === true) {
                result.push(`            ${BLUE}Required.${RESET}`);
            } else {
                result.push(`            ${BLUE}Optional.${RESET}`);
            }
            if (value.defaultValue != null) {
                result.push(
                    `            ${BLUE}Default:${RESET} ${BLUE}${value.defaultValue}${RESET}`,
                );
            }
        }
    }

    if (flags != null && Object.keys(flags).length > 0) {
        result.push(`    ${WHITE}Options:${RESET}`);
        for (const optionKey in flags) {
            if (!Object.hasOwnProperty.call(flags, optionKey)) continue;
            const option = configuration.flags[optionKey];
            if (option == null) continue;
            result.push(`        ${YELLOW}${option.identifier}${RESET}`);
            result.push(
                `            ${GREEN}${option.description.replaceAll("\n", "\n            ")}${RESET}`,
            );
            const requiredRemarks =
                option.requiredRemarks != null && option.requiredRemarks != ""
                    ? ` ${option.requiredRemarks}`
                    : "";
            if (option.required === true) {
                result.push(
                    `            ${BLUE}Required.${RESET}${GREEN}${requiredRemarks}${RESET}`,
                );
            } else {
                result.push(
                    `            ${BLUE}Optional.${RESET}${GREEN}${requiredRemarks}${RESET}`,
                );
            }
            if (option.defaultValue != null) {
                result.push(
                    `            ${BLUE}Default:${RESET} ${BLUE}${option.defaultValue}${RESET}`,
                );
            }
        }
    }

    return result.join("\n");
}
