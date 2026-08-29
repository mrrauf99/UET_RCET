import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    // server-only throws outside a React Server environment.
    alias: { "server-only": fileURLToPath(new URL("./test/server-only.ts", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
