const { resolve } = require("path");
const {
    fileSystemRemotePrefix,
} = require("../utils/git/file-system-remote-url");

const gitRemoteBase = fileSystemRemotePrefix + resolve(__dirname, "remote");

module.exports.gitRemoteBase = gitRemoteBase;
