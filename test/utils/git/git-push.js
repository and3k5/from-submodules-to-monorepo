const { run } = require("../../../utils/process/run");

function gitPush(remoteName, branchName, dir, setUpstream = false) {
    run(
        "git",
        ["push", ...(setUpstream ? ["-u"] : []), remoteName, branchName],
        {
            cwd: dir,
            encoding: "utf-8",
        },
    );
}
module.exports.gitPush = gitPush;
