/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteTsconfigPaths from "vite-tsconfig-paths";
import svgrPlugin from "vite-plugin-svgr";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { viteCommonjs } from "@originjs/vite-plugin-commonjs";

export default defineConfig({
  plugins: [
    react(),
    topLevelAwait(),
    wasm(),
    viteTsconfigPaths(),
    svgrPlugin(),
    viteCommonjs(),
  ],
  optimizeDeps: {
    exclude: ["@spruceid/didkit-wasm"],
  },
  define: {
    "process.env": {},
    global: {},
  },
  test: {
    deps: {
      inline: ["@spruceid/didkit-wasm"],
    },
    globals: true,
    environment: "happy-dom",
    setupFiles: "./src/test/setup.ts",
    // you might want to disable it, if you don't have tests that rely on CSS
    // since parsing CSS is slow
    css: true,
  },
});
