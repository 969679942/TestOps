export type AutomationRunStatus = "queued" | "running" | "passed" | "failed";

export type AutomationRunUpdate = {
  status: AutomationRunStatus;
  reportPath: string | null;
  summary: Record<string, unknown>;
  errorMessage: string | null;
};

export type TestOpsApiClientOptions = {
  baseUrl: string;
  fetchImpl?: typeof fetch;
};

export class TestOpsApiClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: TestOpsApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async updateAutomationRun(
    runId: string | number,
    payload: AutomationRunUpdate,
  ): Promise<unknown> {
    const response = await this.fetchImpl(`${this.baseUrl}/automation-runs/${runId}`, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: payload.status,
        report_path: payload.reportPath,
        summary: payload.summary,
        error_message: payload.errorMessage,
      }),
    });

    if (!response.ok) {
      throw new Error(`TestOps API request failed: ${response.status}`);
    }

    return response.json();
  }
}
