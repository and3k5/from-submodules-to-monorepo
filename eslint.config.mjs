import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import jsdoc from "eslint-plugin-jsdoc";

import { includeIgnoreFile } from "@eslint/compat";
import { fileURLToPath } from "node:url";

export default defineConfig([
    includeIgnoreFile(fileURLToPath(new URL(".gitignore", import.meta.url))),
    {
        files: ["**/*.{js,mjs,cjs,ts}"],
        plugins: { js, jsdoc },
        extends: ["js/recommended", jsdoc.configs["flat/recommended"]],
        rules: {
            "jsdoc/require-jsdoc": "off",
            "jsdoc/require-returns-description": "off",
            "jsdoc/require-param-description": "off",
            "jsdoc/require-property-description": "off",
        },
    },
    {
        files: ["**/*.js"],
        languageOptions: { sourceType: "commonjs" },
    },
    {
        files: ["**/*.{js,mjs,cjs,ts}"],
        languageOptions: { globals: globals.node },
    },
    tseslint.config(tseslint.configs.recommended, {
        rules: {
            "@typescript-eslint/no-require-imports": "off",
        },
    }),
    {
        files: ["**/*.json"],
        ignores: ["package-lock.json"],
        plugins: { json },
        language: "json/json",
        extends: ["json/recommended"],
    },
    {
        files: ["**/*.jsonc"],
        plugins: { json },
        language: "json/jsonc",
        extends: ["json/recommended"],
    },
    {
        files: ["**/*.md"],
        plugins: { markdown },
        language: "markdown/gfm",
        extends: ["markdown/recommended"],
    },
]);
