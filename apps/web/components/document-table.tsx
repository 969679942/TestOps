import React from "react";

import { copy, type Locale } from "../lib/i18n";
import type { DocumentAsset } from "../lib/types";

type DocumentTableProps = Readonly<{
  items: DocumentAsset[];
  locale?: Locale;
}>;

function formatLabel(value: string | undefined, fallback: string) {
  if (!value) {
    return fallback;
  }

  return value
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function DocumentTable({ items, locale = "en" }: DocumentTableProps) {
  const t = copy[locale].components;

  return (
    <section className="data-card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{t.sourceInventory}</span>
          <h3>{t.documentAssets}</h3>
        </div>
        <p>{t.documentIntro}</p>
      </div>

      <div className="table-scroll">
        <table className="data-table" aria-label="Project documents">
          <thead>
            <tr>
              <th scope="col">{t.name}</th>
              <th scope="col">{t.type}</th>
              <th scope="col">{t.source}</th>
              <th scope="col">{t.parseStatus}</th>
            </tr>
          </thead>
          <tbody>
            {items.length ? (
              items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{formatLabel(item.type, t.unknown)}</td>
                  <td>{item.sourceUri ?? t.stored}</td>
                  <td>
                    <span className="status-pill">
                      {formatLabel(item.parseStatus, t.pendingParse)}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="empty-cell">
                  {t.noDocuments}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
