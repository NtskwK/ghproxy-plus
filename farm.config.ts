import path from "node:path";
import { defineConfig } from "@farmfe/core";
import farmJsPluginPostcss from "@farmfe/js-plugin-postcss";

export default defineConfig({
    plugins: ["@farmfe/plugin-react", farmJsPluginPostcss()],
    vitePlugins: [],
    compilation: {
        resolve: {
            alias: {
                "@": path.join(process.cwd(), "src"),
            },
        },
        assets: {
            include: ["md"],
        },
    },
});
