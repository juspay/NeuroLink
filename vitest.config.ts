import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  // Path resolution for imports
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@test": path.resolve(__dirname, "./test"),
    },
  },
});
