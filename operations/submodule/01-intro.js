/**
 *
 * @param {import("../../utils/git/read-gitmodules").Submodule} submodule
 * @param {import("../../utils/git/read-gitmodules").Submodule[]} submodules
 * @param {import("../../utils/output/console-wrapper").ConsoleBase} console
 */
function introduceModule(submodule, submodules, console) {
    console.log(` - Submodule: ${submodule.path}`);
    console.log(
        `   Position: ${submodules.indexOf(submodule)}/${submodules.length - 1}`,
    );
}
module.exports.introduceModule = introduceModule;
