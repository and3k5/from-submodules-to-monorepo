const { resolve } = require("path");

const gitRemoteBase = "file://" + resolve(__dirname, "remote");

module.exports.gitRemoteBase = gitRemoteBase;
