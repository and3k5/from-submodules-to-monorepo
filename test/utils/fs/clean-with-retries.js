const { cleanDirSync } = require("./clean-dir");

/**
 * @param {string} dir
 * @param {string[] | undefined} exclude
 * @param {number} attempts
 */
function cleanWithRetries(dir, exclude, attempts = 3) {
    try {
        cleanDirSync(dir, exclude);
    } catch (e) {
        if ((e.code == "ENOTEMPTY" || e.code == "EBUSY") && attempts > 0) {
            console.log("  retrying clean dir");
            cleanWithRetries(dir, exclude, attempts - 1);
        } else {
            throw e;
        }
    }
}
module.exports.cleanWithRetries = cleanWithRetries;
