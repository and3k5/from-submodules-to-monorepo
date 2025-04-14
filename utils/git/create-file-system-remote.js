const { mkdirSync, existsSync } = require("fs");
const { resolve } = require("path");
const { run } = require("../process/run");

/**
 * @param {string} remoteDir The "current directory" where a new remote will be created
 * @param {string} repoName The name of the repo (without .git)
 * @returns {string} The path to the remote
 */
function createFileSystemRemote(remoteDir, repoName) {
    const dirPath = resolve(remoteDir, repoName + ".git");
    if (existsSync(dirPath)) {
        return dirPath;
    }
    mkdirSync(dirPath);
    run("git", ["init", "--bare"], {
        cwd: dirPath,
        encoding: "utf-8",
    });
    run("git", ["symbolic-ref", "HEAD", "refs/heads/master"], {
        cwd: dirPath,
        encoding: "utf-8",
    });
    return dirPath;
}
module.exports.createFileSystemRemote = createFileSystemRemote;
