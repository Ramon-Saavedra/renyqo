import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

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
          ],
          exclude: nodeTestFiles,
          setupFiles: ["./src/tests/setup.ts"],
        },
      },
    ],
  },
});
