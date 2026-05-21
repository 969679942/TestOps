import { spawn } from "node:child_process";

import type { AutomationRunStatus } from "./api-client.js";

export type PlaywrightCommandInput = {
  specPath: string;
  allureResultsDir: string;
};

export type PlaywrightCommand = {
  command: string;
  args: string[];
  env: NodeJS.ProcessEnv;
};

export type PlaywrightResult = {
  exitCode: number;
  reportPath: string | null;
  stdout: string;
  stderr: string;
};

export type RunnerSummary = {
  status: Extract<AutomationRunStatus, "passed" | "failed">;
  reportPath: string | null;
  summary: Record<string, unknown>;
  errorMessage: string | null;
};

export function buildPlaywrightCommand(input: PlaywrightCommandInput): PlaywrightCommand {
  return {
    command: "npx",
    args: [
      "playwright",
      "test",
      input.specPath,
      "--reporter=line,allure-playwright",
    ],
    env: {
      ...process.env,
      ALLURE_RESULTS_DIR: input.allureResultsDir,
    },
  };
}

export function summarizePlaywrightResult(result: PlaywrightResult): RunnerSummary {
  const errorMessage =
    result.exitCode === 0
      ? null
      : result.stderr.split(/\r?\n/).find(Boolean) ||
        result.stdout.split(/\r?\n/).find(Boolean) ||
        "Playwright exited with a non-zero status.";

  return {
    status: result.exitCode === 0 ? "passed" : "failed",
    reportPath: result.reportPath,
    summary: {
      exit_code: result.exitCode,
    },
    errorMessage,
  };
}

export async function runPlaywrightCommand(
  command: PlaywrightCommand,
): Promise<Omit<PlaywrightResult, "reportPath">> {
  return new Promise((resolve) => {
    const child = spawn(command.command, command.args, {
      env: command.env,
      shell: process.platform === "win32",
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];

    child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.on("close", (code) => {
      resolve({
        exitCode: code ?? 1,
        stdout: Buffer.concat(stdout).toString("utf-8"),
        stderr: Buffer.concat(stderr).toString("utf-8"),
      });
    });
  });
}
