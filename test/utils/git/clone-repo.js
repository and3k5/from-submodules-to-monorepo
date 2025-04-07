const { resolve } = require("path");
const { run } = require("../../../utils/process/run");
const { remotePath } = require("./remote-path");

function cloneRepo(reponame, dir) {
    const remoteUrl = remotePath(reponame);
    run("git", ["clone", remoteUrl], {
        cwd: dir,
        encoding: "utf-8",
    });
    return resolve(dir, reponame);
}
module.exports.cloneRepo = cloneRepo;
