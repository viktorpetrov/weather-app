/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { apiPlugin } from "./src/server/vite-plugin-api";

export default defineConfig({
  plugins: [react(), tailwindcss(), apiPlugin()],
  test: {
    environment: "node",
  },
});
