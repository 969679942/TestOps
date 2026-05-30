import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: process.env.TESTOPS_RUNNER_TEST_DIR ?? ".",
  outputDir: process.env.TESTOPS_RUNNER_OUTPUT_DIR ?? "test-results",
  reporter: [["line"], ["allure-playwright"]],
  use: {
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
});
