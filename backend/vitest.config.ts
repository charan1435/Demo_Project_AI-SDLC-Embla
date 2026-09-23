import { defineConfig } from "vitest/config";
import path from "node:path";
import dotenv from "dotenv";

// Load backend/.env explicitly (not cwd-dependent) so DATABASE_URL is set
// for the Prisma Client used by tests under tests/backend/.
dotenv.config({ path: path.resolve(__dirname, ".env") });

// Test files for backend/ live under tests/backend/ per tests/CLAUDE.md's
// tree layout (tests/backend, tests/frontend, tests/e2e), not co-located
// with backend/src/. We point Vitest's `include` there, and alias
// `@prisma/client` to backend/'s own node_modules so imports resolve
// correctly regardless of the physical location of the importing test file.
export default defineConfig({
  test: {
    include: ["../tests/backend/**/*.test.ts"],
    environment: "node",
    testTimeout: 20000,
    hookTimeout: 20000,
  },
  resolve: {
    alias: {
      "@prisma/client": path.resolve(__dirname, "node_modules/@prisma/client"),
    },
  },
});
