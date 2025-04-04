const { resolve } = require("path");
const { run } = require("../../../utils/process/run");
const { gitRemoteBase } = require("../../globals");

function cloneRepo(reponame, dir) {
    const remotePath = gitRemoteBase + "/" + reponame + ".git";
    run("git", ["clone", remotePath], {
        cwd: dir,
        encoding: "utf-8",
    });
    return resolve(dir, reponame);
}
module.exports.cloneRepo = cloneRepo;
