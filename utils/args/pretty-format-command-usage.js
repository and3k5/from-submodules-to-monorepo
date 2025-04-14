/**
 * @param {string} fileName
 * @param {import("./command-config").CommandUsageConfig} configuration
 * @returns {string}
 */
function prettyFormatCommandUsage(fileName, configuration) {
    const result = [];
    const flags = configuration.flags;
    result.push("Usage:");
    let commandLine = `${fileName}`;
    if (flags != null && Object.keys(flags).length > 0) {
        commandLine += " <OPTIONS>";
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
                commandLine += ` <${value.identifier}>[,<${value.identifier}>,...]`;
            } else {
                if (value.required === true) {
                    commandLine += ` <${value.identifier}>`;
                } else {
                    commandLine += ` [<${value.identifier}>]`;
                }
            }
        }
    }
    result.push(commandLine);

    if (
        configuration.values != null &&
        Object.keys(configuration.values).length > 0
    ) {
        result.push("    Values:");
        for (const valueKey in configuration.values) {
            if (!Object.hasOwnProperty.call(configuration.values, valueKey))
                continue;
            const value = configuration.values[valueKey];
            if (value == null) continue;
            result.push(`        ${value.identifier}`);
            result.push(
                `            ${value.description.replaceAll("\n", "\n            ")}`,
            );
            if (value.required === true) {
                result.push("            Required.");
            } else {
                result.push("            Optional.");
            }
            if (value.defaultValue != null) {
                result.push(`            Default: ${value.defaultValue}`);
            }
        }
    }

    if (flags != null && Object.keys(flags).length > 0) {
        result.push("    Options:");
        for (const optionKey in flags) {
            if (!Object.hasOwnProperty.call(flags, optionKey)) continue;
            const option = configuration.flags[optionKey];
            if (option == null) continue;
            result.push(`        ${option.identifier}`);
            result.push(
                `            ${option.description.replaceAll("\n", "\n            ")}`,
            );
            const requiredRemarks =
                option.requiredRemarks != null && option.requiredRemarks != ""
                    ? ` ${option.requiredRemarks}`
                    : "";
            if (option.required === true) {
                result.push(`            Required.${requiredRemarks}`);
            } else {
                result.push(`            Optional.${requiredRemarks}`);
            }
            if (option.defaultValue != null) {
                result.push(`            Default: ${option.defaultValue}`);
            }
        }
    }

    return result.join("\n");
}

module.exports.prettyFormatCommandUsage = prettyFormatCommandUsage;
