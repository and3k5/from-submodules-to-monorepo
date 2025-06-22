# Usage

## ⚠ Disclaimer ⚠

⚠ **Use at your own risk!**  
This script is highly experimental and may cause irreversible damage, including but not limited to data loss, corruption of repositories, or deletion of your entire project. I will not be held responsible or liable for any damages, errors, or losses caused by using this solution. Always ensure you have proper backups before proceeding.

## Command line

<div id="command-line-usage-begin"></div>

<pre>
<code style="color: rgb(204, 204, 204);">Usage:</code>
<code style="color: rgb(0, 0, 204);">npx from-submodules-to-monorepo</code> <code style="color: rgb(0, 204, 204);">&lt;</code><code style="color: rgb(204, 204, 0);">OPTIONS</code><code style="color: rgb(0, 204, 204);">&gt;</code> <code style="color: rgb(0, 204, 204);">&lt;</code><code style="color: rgb(204, 204, 0);">repo-dir</code><code style="color: rgb(0, 204, 204);">&gt;</code> <code style="color: rgb(0, 204, 204);">[</code><code style="color: rgb(204, 204, 0);">&lt;branch-name</code><code style="color: rgb(0, 204, 204);">&gt;]</code>
    <code style="color: rgb(204, 204, 204);">Values:</code>
        <code style="color: rgb(204, 204, 0);">repo-dir</code>
            <code style="color: rgb(0, 204, 0);">Path to the main repo directory.</code>
            <code style="color: rgb(0, 0, 204);">Required.</code>
        <code style="color: rgb(204, 204, 0);">branch-name</code>
            <code style="color: rgb(0, 204, 0);">Name of the branch to create for the migration.</code>
            <code style="color: rgb(0, 0, 204);">Optional.</code>
            <code style="color: rgb(0, 0, 204);">Default:</code> <code style="color: rgb(0, 0, 204);">from-submodules-to-monorepo</code>
    <code style="color: rgb(204, 204, 204);">Options:</code>
        <code style="color: rgb(204, 204, 0);">--help</code>
            <code style="color: rgb(0, 204, 0);">Show this help message.</code>
            <code style="color: rgb(0, 0, 204);">Optional.</code><code style="color: rgb(0, 204, 0);"></code>
        <code style="color: rgb(204, 204, 0);">--enable-colors</code>
            <code style="color: rgb(0, 204, 0);">Enable colors in the output.</code>
            <code style="color: rgb(0, 0, 204);">Optional.</code><code style="color: rgb(0, 204, 0);"></code>
        <code style="color: rgb(204, 204, 0);">--version</code>
            <code style="color: rgb(0, 204, 0);">Show the version of this package.</code>
            <code style="color: rgb(0, 0, 204);">Optional.</code><code style="color: rgb(0, 204, 0);"></code>
        <code style="color: rgb(204, 204, 0);">--acknowledge-risks-and-continue</code>
            <code style="color: rgb(0, 204, 0);">Acknowledge the risks</code>
            <code style="color: rgb(0, 0, 204);">Required.</code><code style="color: rgb(0, 204, 0);"></code>
        <code style="color: rgb(204, 204, 0);">--reset-with-master-or-main-branches</code>
            <code style="color: rgb(0, 204, 0);">Reset the branches to master or main before running transformation.</code>
            <code style="color: rgb(0, 0, 204);">Optional.</code><code style="color: rgb(0, 204, 0);"></code>
        <code style="color: rgb(204, 204, 0);">--no-threads</code>
            <code style="color: rgb(0, 204, 0);">Don&#039;t run in parallel threads.</code>
            <code style="color: rgb(0, 0, 204);">Optional.</code><code style="color: rgb(0, 204, 0);"> Required if --pull-remotes is used without --nuke-remote.</code>
        <code style="color: rgb(204, 204, 0);">--pull-remotes</code>
            <code style="color: rgb(0, 204, 0);">Pull remotes for all submodules and main repo.
            Must be used with either --no-threads or --nuke-remote.</code>
            <code style="color: rgb(0, 0, 204);">Optional.</code><code style="color: rgb(0, 204, 0);"></code>
        <code style="color: rgb(204, 204, 0);">--nuke-remote</code>
            <code style="color: rgb(0, 204, 0);">Safety switch to avoid pulling remotes uncontrollably.</code>
            <code style="color: rgb(0, 0, 204);">Optional.</code><code style="color: rgb(0, 204, 0);"> Required if --pull-remotes is used without --no-threads.</code>
        <code style="color: rgb(204, 204, 0);">--delete-existing-branches</code>
            <code style="color: rgb(0, 204, 0);">If any branch exist (&lt;branch-name&gt;) then delete them.</code>
            <code style="color: rgb(0, 0, 204);">Optional.</code><code style="color: rgb(0, 204, 0);"></code>
        <code style="color: rgb(204, 204, 0);">--create-report</code>
            <code style="color: rgb(0, 204, 0);">Create a report with the transformation output and tree files to compare before and after.</code>
            <code style="color: rgb(0, 0, 204);">Optional.</code><code style="color: rgb(0, 204, 0);"></code>
        <code style="color: rgb(204, 204, 0);">--create-tree-files</code>
            <code style="color: rgb(0, 204, 0);">Create tree files to compare before and after.
            Overwritten when using --create-report.</code>
            <code style="color: rgb(0, 0, 204);">Optional.</code><code style="color: rgb(0, 204, 0);"></code>

</pre>

<div id="command-line-usage-end"></div>

You will be asked to add `--acknowledge-risks-and-continue` to acknowledge that this might cause irreversible damage.

## Example usage

```bash
npx from-submodules-to-monorepo --keep-untracked-files --reset-with-master-or-main-branches --delete-existing-branches /home/user/dev/my-very-huge-project transform-repository
```

*Note: I left out the `--acknowledge-risks-and-continue` to prevent a copy paste ending up ruining someones life*

# Development

## Testing

### Run simulation

The entire process is automated by running:

```bash
npm test
```

This will create local repositories with random commit histories and then perform the transformation.

### What does the test do?

- It creates a bunch of remotes (actually stored in a folder).
- It clones every repository and creates files and directories.
- It performs the transformation.
