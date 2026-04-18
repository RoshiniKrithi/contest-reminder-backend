import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  // Vite root is the client folder — index.html lives there
  root: path.resolve(__dirname, "client"),

  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      // @shared points to server/shared — types only, no runtime code
      "@shared": path.resolve(__dirname, "server", "shared"),
    },
  },

  build: {
    // Output goes to repo-root/dist, which matches vercel.json outputDirectory
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  },

  server: {
    port: 5005,
    host: "0.0.0.0",
    fs: { strict: false },
    proxy: {
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
