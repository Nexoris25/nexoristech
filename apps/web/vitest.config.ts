import { defineConfig } from "vitest/config";

export default defineConfig({
  /*
   * The automatic JSX runtime, so a test can import a module that reaches a .tsx file.
   *
   * Content modules for the ported service pages hold a hero widget as JSX beside the copy, so
   * importing the service registry — to read the hero image a page shares — pulled JSX into the test
   * and failed with "React is not defined". esbuild defaults to the classic runtime, which expects a
   * React import in every file; the app itself builds with the automatic one.
   */
  esbuild: { jsx: "automatic" },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
