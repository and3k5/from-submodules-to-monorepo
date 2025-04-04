const { run } = require("../../../utils/process/run");

function gitCommit(message, dir) {
    run("git", ["commit", "-m", message], {
        cwd: dir,
        encoding: "utf-8",
    });
}
module.exports.gitCommit = gitCommit;
