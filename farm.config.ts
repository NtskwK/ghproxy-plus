import { defineConfig } from '@farmfe/core';
import path from 'path';
import farmJsPluginPostcss from '@farmfe/js-plugin-postcss';

export default defineConfig({
  plugins: ['@farmfe/plugin-react', farmJsPluginPostcss()],
  vitePlugins: [],
  compilation: {
    resolve: {
      alias: {
        "@": path.join(process.cwd(), "src"),
      }
    },
    assets: {
      include: ["md"],
    }
  }
});
