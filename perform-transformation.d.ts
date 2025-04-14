interface PerformTransformationOptions {
    /** Branch name to create for the migration */
    migrationBranchName: string;
    /**  Resume in branch that already exists instead of creating new branch */
    resumeFromExistingBranch?: boolean;
    /**  Reset branches checkout, cleanup and such */
    resetWithMasterOrMainBranches?: boolean;
    /**  Delete existing branches */
    deleteExistingBranches?: boolean;
    /**  Don't run in parallel threads */
    noThreads?: boolean;
    /**  Pull remotes for all submodules and main repo */
    pullRemotes?: boolean;
    /**  Safety switch to avoid pulling remotes uncontrollably */
    nukeRemote?: boolean;
    /** Create tree files to compare directory before and after transformation */
    createTreeFiles?: boolean;
    /** Create a report directory with all the information and output from the transformation */
    createReport?: boolean;
}

interface TransformationResult {
    success: true;
    treeBeforePath?: string;
    treeAfterPath?: string;
}

export function performTransformation(
    mainRepoDir: string,
    options: PerformTransformationOptions,
): Promise<TransformationResult>;
