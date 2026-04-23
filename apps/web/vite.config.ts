import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/patterns": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/sessions": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
