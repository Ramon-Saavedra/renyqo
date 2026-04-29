import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    include: [
      "src/tests/**/*.test.{ts,tsx}",
      "src/components/**/*.test.{ts,tsx}",
    ],
    setupFiles: ["./src/tests/setup.ts"],
  },
});
