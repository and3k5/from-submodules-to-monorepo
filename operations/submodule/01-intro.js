/**
 *
 * @param {import("../../utils/git/read-gitmodules").Submodule} submodule
 * @param {import("../../utils/git/read-gitmodules").Submodule[]} submodules
 */
function introduceModule(submodule, submodules) {
    console.log(` - Submodule: ${submodule.path}`);
    console.log(
        `   Position: ${submodules.indexOf(submodule)}/${submodules.length - 1}`,
    );
}
module.exports.introduceModule = introduceModule;
