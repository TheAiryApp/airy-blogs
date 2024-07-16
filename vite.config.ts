import { defineConfig } from "vite";
import tailwindcss from "tailwindcss";
import { fileURLToPath } from "node:url";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: "esnext",
  },
  // assetsInclude: [".vitepress/cache/fileCache/**/*"],
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
  resolve: {
    alias: [
      {
        find: "@",
        replacement: fileURLToPath(import.meta.url),
      },
    ],
  },
});
