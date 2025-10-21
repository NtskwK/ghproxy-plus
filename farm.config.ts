import path from "node:path";
import { defineConfig } from "@farmfe/core";
import farmJsPluginPostcss from "@farmfe/js-plugin-postcss";
import devserver from "@hono/vite-dev-server"

function honoVitePlugin() {
  return {
    name: "hono-devserver-plugin",
    plugin: devserver,
  }
}

export default defineConfig({
  plugins: ["@farmfe/plugin-react", farmJsPluginPostcss()],
  vitePlugins: [honoVitePlugin()],
  compilation: {
    resolve: {
      alias: {
        "@": path.join(process.cwd(), "src")
      }
    },
    assets: {
      include: ["md"]
    }
  }
});
