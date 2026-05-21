import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildPlaywrightCommand, summarizePlaywrightResult } from "./run.js";

describe("buildPlaywrightCommand", () => {
  it("runs generated specs with line and allure reporters", () => {
    const command = buildPlaywrightCommand({
      specPath: "D:/TestOps/var/artifacts/automation/specs/checkout.spec.ts",
      allureResultsDir: "D:/TestOps/var/artifacts/automation/runs/run-9/allure-results",
    });

    assert.equal(command.command, "npx");
    assert.deepEqual(command.args, [
      "playwright",
      "test",
      "D:/TestOps/var/artifacts/automation/specs/checkout.spec.ts",
      "--reporter=line,allure-playwright",
    ]);
    assert.equal(
      command.env.ALLURE_RESULTS_DIR,
      "D:/TestOps/var/artifacts/automation/runs/run-9/allure-results",
    );
  });
});

describe("summarizePlaywrightResult", () => {
  it("maps exit code zero to passed", () => {
    assert.deepEqual(
      summarizePlaywrightResult({
        exitCode: 0,
        reportPath: "automation/runs/run-9/report/index.html",
        stdout: "1 passed",
        stderr: "",
      }),
      {
        status: "passed",
        reportPath: "automation/runs/run-9/report/index.html",
        summary: {
          exit_code: 0,
        },
        errorMessage: null,
      },
    );
  });

  it("maps non-zero exit code to failed with a compact error message", () => {
    assert.deepEqual(
      summarizePlaywrightResult({
        exitCode: 1,
        reportPath: null,
        stdout: "",
        stderr: "locator timeout\ntrace attached",
      }),
      {
        status: "failed",
        reportPath: null,
        summary: {
          exit_code: 1,
        },
        errorMessage: "locator timeout",
      },
    );
  });
});
