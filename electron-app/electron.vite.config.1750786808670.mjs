// electron.vite.config.ts
import react from "@vitejs/plugin-react";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import { resolve } from "path";
var __electron_vite_injected_dirname = "/Users/arnestrickmann/llmstuff/whatdidyougetdonetoday-ai/electron-app";
var electron_vite_config_default = defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__electron_vite_injected_dirname, "src/preload/index.ts"),
          floatingPreload: resolve(__electron_vite_injected_dirname, "src/preload/floatingPreload.ts")
        }
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
        src: resolve("src/renderer/src")
      }
    },
    plugins: [react()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__electron_vite_injected_dirname, "src/renderer/index.html"),
          floating: resolve(__electron_vite_injected_dirname, "src/renderer/floating.html")
        }
      }
    }
  }
});
export {
  electron_vite_config_default as default
};
