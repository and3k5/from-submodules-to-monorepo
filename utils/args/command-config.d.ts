interface CommandUsageConfig<
    TFlagKey extends string[],
    TValueKey extends string[],
> {
    flags: {
        [key: TFlagKey]: CommandUsageOptionsConfig;
    };
    values: {
        [key: TValueKey]: CommandUsagePullValue;
    };
}

interface CommandUsageValue<
    TFlagKey extends string[],
    TValueKey extends string[],
> {
    flags: {
        [key: TFlagKey]: boolean?;
    };
    values: {
        [key: TValueKey]: string?;
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
    required: ?bool;
    customNotation: ?"multiple-values-comma-separated";
    defaultValue: ?string;
}

function createConfig<TFlagKey extends string[], TValueKey extends string[]>(
    config: CommandUsageConfig<TFlagKey, TValueKey>,
): CommandUsageConfig<TFlagKey, TValueKey>;

function getCommandValues<
    TFlagKey extends string[],
    TValueKey extends string[],
>(
    config: CommandUsageConfig<TFlagKey, TValueKey>,
    args: string[],
): CommandUsageValue<TFlagKey, TValueKey>;
