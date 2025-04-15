import { pullFlag } from "./pull-flag";
import { pullValue } from "./pull-value";

export function createConfig<
    TFlagKey extends string[],
    TValueKey extends string[],
>(
    config: CommandUsageConfig<TFlagKey, TValueKey>,
): CommandUsageConfig<TFlagKey, TValueKey> {
    return config;
}

export interface CommandUsageConfig<
    TFlagKey extends string[],
    TValueKey extends string[],
> {
    flags: {
        [key in TFlagKey[number]]: CommandUsageOptionsConfig;
    };
    values: {
        [key in TValueKey[number]]: CommandUsagePullValue;
    };
}

interface CommandUsageValue<
    TFlagKey extends string[],
    TValueKey extends string[],
> {
    flags: {
        [key in TFlagKey[number]]?: boolean;
    };
    values: {
        [key in TValueKey[number]]?: string;
    };
}

interface CommandUsageOptionsConfig {
    identifier: string;
    description: string;
    required?: boolean;
    requiredRemarks?: string;
    defaultValue?: string;
}

interface CommandUsagePullValue {
    identifier: string;
    description: string;
    required?: boolean;
    customNotation?: "multiple-values-comma-separated";
    defaultValue?: string;
}

export function getCommandValues<
    TFlagKey extends string[],
    TValueKey extends string[],
>(
    config: CommandUsageConfig<TFlagKey, TValueKey>,
    args: string[],
): CommandUsageValue<TFlagKey, TValueKey> | null {
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
