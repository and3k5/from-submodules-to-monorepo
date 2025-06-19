# What is this?

This utility transforms a big project with many submodules into a single monorepo.

The purpose is to keep the commit history "intact" while consolidating everything into one repository.

## ⚠ Disclaimer ⚠

⚠ **Use at your own risk!**  
This script is highly experimental and may cause irreversible damage, including but not limited to data loss, corruption of repositories, or deletion of your entire project. I will not be held responsible or liable for any damages, errors, or losses caused by using this solution. Always ensure you have proper backups before proceeding.

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

# How to use?

See USAGE.md for more

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
