import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createRunArtifactPaths } from "./artifacts.js";

describe("createRunArtifactPaths", () => {
  it("creates stable report and allure directories for a run", () => {
    const paths = createRunArtifactPaths({
      artifactRoot: "D:/TestOps/var/artifacts",
      runId: 9,
    });

    assert.equal(paths.runRoot, "D:/TestOps/var/artifacts/automation/runs/run-9");
    assert.equal(
      paths.reportPath,
      "D:/TestOps/var/artifacts/automation/runs/run-9/report/index.html",
    );
    assert.equal(
      paths.allureResultsDir,
      "D:/TestOps/var/artifacts/automation/runs/run-9/allure-results",
    );
  });
});
