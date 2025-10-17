import path from "path";
import webpack from "webpack";
import { getVersion } from "./src/utils/version/get-version";
// in case you run into any typescript error when configuring `devServer`
//import "webpack-dev-server";

const config: webpack.Configuration = {
    target: "node",
    mode: "production",
    entry: {
        "perform-transformation": {
            import: "./src/index.ts",
            filename: "perform-transformation.js",
        },
        test: {
            import: "./src/test/index.ts",
            filename: "test.js",
        },
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: [/node_modules/, /typings/],
            },
        ],
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        clean: true,
        chunkFilename: "[name].js",
    },
    plugins: [
        new webpack.BannerPlugin({ banner: "#!/usr/bin/env node", raw: true }),
        new webpack.DefinePlugin({
            __VERSION__: JSON.stringify(getVersion()),
        }),
    ],
    resolve: {
        extensions: [".ts", ".js", ".mjs"],
    },
};

export default config;
