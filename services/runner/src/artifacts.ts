import path from "node:path";

export type RunArtifactPathsInput = {
  artifactRoot: string;
  runId: string | number;
};

export type RunArtifactPaths = {
  runRoot: string;
  reportPath: string;
  allureResultsDir: string;
};

function toPortablePath(value: string): string {
  return value.replace(/\\/g, "/");
}

export function createRunArtifactPaths(input: RunArtifactPathsInput): RunArtifactPaths {
  const runRoot = path.join(input.artifactRoot, "automation", "runs", `run-${input.runId}`);
  return {
    runRoot: toPortablePath(runRoot),
    reportPath: toPortablePath(path.join(runRoot, "report", "index.html")),
    allureResultsDir: toPortablePath(path.join(runRoot, "allure-results")),
  };
}
