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

interface CommandUsageConfiguration {
    options: CommandUsageOptionsConfig[];
    values: CommandUsagePullValue[];
}

export function prettyFormatCommandUsage(
    fileName: string,
    configuration: CommandUsageConfiguration,
): string;
