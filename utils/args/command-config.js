const { pullFlag } = require("./pull-flag");
const { pullValue } = require("./pull-value");

function createConfig(config) {
    return config;
}
module.exports.createConfig = createConfig;

/**
 *
 * @param {import("./command-config").CommandUsageConfig} config
 * @param {string[]} args
 * @returns {import("./command-config").CommandUsageValue}
 */
function getCommandValues(config, args) {
    args = args.concat();
    const commandValues = {
        flags: {},
        values: {},
    };
    for (const flagKey in config.flags) {
        if (Object.hasOwnProperty.call(config.flags, flagKey)) {
            commandValues.flags[flagKey] = pullFlag(
                args,
                config.flags[flagKey].identifier,
            );
        }
    }
    for (const key in config.values) {
        if (Object.prototype.hasOwnProperty.call(config.values, key)) {
            commandValues.values[key] = pullValue(args);
        }
    }

    if (args.length > 1) {
        return null;
    }

    return commandValues;
}
module.exports.getCommandValues = getCommandValues;
