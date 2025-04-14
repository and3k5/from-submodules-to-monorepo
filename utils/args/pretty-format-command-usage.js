/**
 * @param {string} fileName
 * @param {import("./pretty-format-command-usage").CommandUsageConfiguration} configuration
 * @returns {string}
 */
function prettyFormatCommandUsage(fileName, configuration) {
    const result = [];
    const options = configuration.options;
    result.push("Usage:");
    let commandLine = `${fileName}`;
    if (options != null && options.length > 0) {
        commandLine += " <OPTIONS>";
    }
    if (configuration.values != null && configuration.values.length > 0) {
        for (const value of configuration.values) {
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

    if (configuration.values != null && configuration.values.length > 0) {
        result.push("    Values:");
        for (const value of configuration.values) {
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

    if (options != null && options.length > 0) {
        result.push("    Options:");
        for (const option of options) {
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
