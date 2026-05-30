import { copy } from "../lib/copy";

export default function RootLoadingPage() {
  return (
    <main className="loading-page" aria-live="polite" aria-busy="true">
      <span className="spinner" aria-hidden="true" />
      <p>{copy.loading}</p>
    </main>
  );
}
