import { resolve } from "path";
import { fileSystemRemotePrefix } from "../utils/git/file-system-remote-url";
import { cwd } from "process";

export const testOutDir = resolve(cwd(), "test-env-data");

export const gitRemoteBase = fileSystemRemotePrefix + resolve(testOutDir, "remote");
