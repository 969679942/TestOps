import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { TestOpsApiClient } from "./api-client.js";

describe("TestOpsApiClient", () => {
  it("patches automation run status, report path, summary, and error message", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const client = new TestOpsApiClient({
      baseUrl: "http://api.test",
      fetchImpl: async (url, init) => {
        calls.push({ url: String(url), init: init ?? {} });
        return new Response(JSON.stringify({ id: 9, status: "passed" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    });

    await client.updateAutomationRun(9, {
      status: "passed",
      reportPath: "automation/reports/run-9/index.html",
      summary: {
        passed: 3,
        failed: 0,
      },
      errorMessage: null,
    });

    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "http://api.test/automation-runs/9");
    assert.equal(calls[0].init.method, "PATCH");
    assert.deepEqual(JSON.parse(String(calls[0].init.body)), {
      status: "passed",
      report_path: "automation/reports/run-9/index.html",
      summary: {
        passed: 3,
        failed: 0,
      },
      error_message: null,
    });
  });

  it("throws for non-successful API responses", async () => {
    const client = new TestOpsApiClient({
      baseUrl: "http://api.test/",
      fetchImpl: async () =>
        new Response(JSON.stringify({ detail: "boom" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }),
    });

    await assert.rejects(
      () =>
        client.updateAutomationRun(9, {
          status: "failed",
          reportPath: null,
          summary: {},
          errorMessage: "runner failed",
        }),
      /TestOps API request failed: 503/,
    );
  });
});
