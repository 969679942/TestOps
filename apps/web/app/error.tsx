"use client";

import { useEffect } from "react";

import { copy } from "../lib/copy";

type ErrorPageProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function RootErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="error-page">
      <section className="error-page-dialog" role="alert" aria-live="assertive">
        <div className="error-page-dialog-header">
          <span className="error-page-dialog-icon" aria-hidden="true">
            i
          </span>
          <h1>{copy.pageErrorTitle}</h1>
        </div>
        <p className="error-page-dialog-copy">{error.message || copy.pageErrorHint}</p>
        <div className="error-page-dialog-actions">
          <button
            className="button-secondary error-page-dialog-cancel"
            type="button"
            onClick={reset}
          >
            {copy.retry}
          </button>
          <a className="button-primary error-page-dialog-primary" href="/">
            {copy.backHome}
          </a>
        </div>
      </section>
    </main>
  );
}
