const { getVersion } = require("./get-version");

var version = "v" + getVersion();
const command =
    "git tag -f -a " + version + ' -m "Tag version ' + version + '"';
if (process.argv.findIndex((x) => x.toLowerCase() === "--run-command")) {
    console.log("Running command: " + command);
    require("child_process").execSync(command);
} else {
    console.log(command);
}
