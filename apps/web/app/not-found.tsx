import Link from "next/link";

import { copy } from "../lib/copy";

export default function NotFoundPage() {
  return (
    <main className="error-page">
      <section className="empty-card wide">
        <h1>{copy.notFoundTitle}</h1>
        <p>{copy.notFoundHint}</p>
        <Link className="button-primary" href="/">
          {copy.backHome}
        </Link>
      </section>
    </main>
  );
}
