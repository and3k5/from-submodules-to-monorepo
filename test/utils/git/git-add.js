const { run } = require("../../../utils/process/run");

function gitAdd(file, dir) {
    run("git", ["add", file], {
        cwd: dir,
        encoding: "utf-8",
    });
}
module.exports.gitAdd = gitAdd;
