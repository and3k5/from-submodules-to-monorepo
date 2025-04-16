# What is this?

This utility transforms a big project with many submodules into a single monorepo.

The purpose is to keep the commit history "intact" while consolidating everything into one repository.

## Example

Imagine this is the current project:

```text
MySuperProject/README.md       [file]
MySuperProject/WebApplication1 [submodule]
MySuperProject/ClassProject1   [submodule]
MySuperProject/ClassProject2   [folder]
```

The expected result would be:

```text
MySuperProject/README.md       [file]
MySuperProject/WebApplication1 [folder]
MySuperProject/ClassProject1   [folder]
MySuperProject/ClassProject2   [folder]
```

### Is that so hard?

Maybe not if you have only 2 submodules. But if you have 100+ submodules, it becomes a very daunting task.

Every submodule will be moved into a nested folder to be merged with the main repository.

# Testing

## Run simulation

The entire process is automated by running:

```bash
node test/index.js
```

This will create local repositories with random commit histories and then perform the transformation.

## What does the test do?

- It creates a bunch of remotes (actually stored in a folder).
- It clones every repository and creates files and directories.
- It performs the transformation.

# Usage

## ⚠ Disclaimer ⚠

⚠ **Use at your own risk!**  
This script is highly experimental and may cause irreversible damage, including but not limited to data loss, corruption of repositories, or deletion of your entire project. I will not be held responsible or liable for any damages, errors, or losses caused by using this solution. Always ensure you have proper backups before proceeding.

## Command line

<div id="command-line-usage-begin"></div>

```text
Usage:
npx from-submodules-to-monorepo <OPTIONS> <repo-dir> [<branch-name>]
    Values:
        repo-dir
            Path to the main repo directory.
            Required.
        branch-name
            Name of the branch to create for the migration.
            Optional.
            Default: from-submodules-to-monorepo
    Options:
        --help
            Show this help message.
            Optional.
        --version
            Show the version of this package.
            Optional.
        --acknowledge-risks-and-continue
            Acknowledge the risks
            Required.
        --reset-with-master-or-main-branches
            Reset the branches to master or main before running transformation.
            Optional.
        --no-threads
            Don't run in parallel threads.
            Optional. Required if --pull-remotes is used without --nuke-remote.
        --pull-remotes
            Pull remotes for all submodules and main repo.
            Must be used with either --no-threads or --nuke-remote.
            Optional.
        --nuke-remote
            Safety switch to avoid pulling remotes uncontrollably.
            Optional. Required if --pull-remotes is used without --no-threads.
        --delete-existing-branches
            If any branch exist (<branch-name>) then delete them.
            Optional.
        --create-report
            Create a report with the transformation output and tree files to compare before and after.
            Optional.
        --create-tree-files
            Create tree files to compare before and after.
            Overwritten when using --create-report.
            Optional.

```

<div id="command-line-usage-end"></div>

You will be asked to add `--acknowledge-risks-and-continue` to acknowledge that this might cause irreversible damage.

## What does `perform-transformation.js` do?

- It checks out a new branch in the main repository.
- For every submodule in the main repository, it:
    - Checks out a new branch in the submodule repository.
    - Creates a directory with the same name as the submodule inside the submodule repository.
    - Moves everything in the submodule repository into the newly created directory.
    - Commits and pushes changes to the submodule repository origin.
    - Removes the submodule from the main repository.
    - In the main repository: pulls from the submodule repository origin.

## Is it safe?

No! It might delete all your data. Back up everything and proceed with extreme caution.

## What is under the hood?

- Some Node.js code that performs the transformation.
- Dangerous operations — handle with care!
