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
      <section className="alert-panel" role="alert">
        <h1>{copy.pageErrorTitle}</h1>
        <p>{error.message || copy.pageErrorHint}</p>
        <div className="inline-actions">
          <button className="button-primary" type="button" onClick={reset}>
            {copy.retry}
          </button>
          <a className="button-secondary" href="/">
            {copy.backHome}
          </a>
        </div>
      </section>
    </main>
  );
}
