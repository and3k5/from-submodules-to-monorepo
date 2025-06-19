import { Submodule } from ".";


export const submodules : {[key: string]: Submodule}= {
    commons: {
        name: "commons",
        customReadMeName: "README-commons.md",
        skipAddAsSubmodule: true,
    },
    Webserver: {
        name: "Webserver",
    },
    Documentation: {
        name: "Documentation",
    },
    Commandline: {
        name: "Commandline",
    },
    service: {
        name: "service",
    },
    surveillance: {
        name: "surveillance",
        deletes: ["README-commons.md"],
    },
    worker: {
        name: "worker",
    },
    "data-and-stuff": {
        name: "data-and-stuff",
    },
};

export function getSubmodule(key : keyof typeof submodules) {
    return submodules[key];
}

export function getSubmodules() : Submodule[] {
    return Object.keys(submodules).map(x => submodules[x]);
}