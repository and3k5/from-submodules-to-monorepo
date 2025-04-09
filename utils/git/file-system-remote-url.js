const { resolve } = require("path");

module.exports.fileSystemRemotePrefix = "file://";

function fileSystemRemoteUrl(path) {
    return (
        module.exports.fileSystemRemotePrefix +
        resolve(path).replace(/\\/g, "/")
    );
}
module.exports.fileSystemRemoteUrl = fileSystemRemoteUrl;
