const { gitRemoteBase } = require("../../globals");

function remotePath(reponame) {
    const remotePath = gitRemoteBase + "/" + reponame + ".git";
    return remotePath;
}

module.exports.remotePath = remotePath;
