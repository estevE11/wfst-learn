import { defineConfig } from "vitest/config";

// Kept separate from vite.config.ts: the top-level installed `vite` version
// and the version vitest bundles as its own peer dependency can drift apart
// (they did at the time this was written), which breaks the `test` field's
// type when merged into vite's `defineConfig`. `vitest/config` provides its
// own self-contained config type, so this avoids that entirely.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
