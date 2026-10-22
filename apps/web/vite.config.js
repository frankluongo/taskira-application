import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
    // Keep the default (false): resolving @taskira/ui to its real path in
    // packages/ui (not the node_modules symlink) is what lets
    // @vitejs/plugin-react's Fast Refresh pick up its .jsx files at all.
    preserveSymlinks: false,
  },
  test: {
    include: ["src/**/*.test.js"],
    environment: "node",
  },
});
