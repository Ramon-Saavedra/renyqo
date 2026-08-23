import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nodeTestFiles = [
  "src/lib/api/**/*.test.ts",
  "src/lib/utils/cn.test.ts",
  "src/features/auth/utils/**/*.test.ts",
  "src/features/provider/dashboard/api/**/*.test.ts",
  "src/features/provider/listings-overview/api/**/*.test.ts",
  "src/features/provider/listings-overview/utils/**/*.test.ts",
];

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      "next/image": path.resolve(__dirname, "src/tests/mocks/next-image.tsx"),
    },
  },
  test: {
    pool: "threads",
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          isolate: false,
          include: nodeTestFiles,
        },
      },
      {
        extends: true,
        test: {
          name: "jsdom",
          environment: "jsdom",
          include: [
            "src/tests/**/*.test.{ts,tsx}",
            "src/lib/**/*.test.{ts,tsx}",
            "src/components/**/*.test.{ts,tsx}",
            "src/features/**/*.test.{ts,tsx}",
            "src/app/**/*.test.{ts,tsx}",
          ],
          exclude: nodeTestFiles,
          setupFiles: ["./src/tests/setup.ts"],
        },
      },
    ],
  },
});
