import React from "react";

import { copy, formatValue, type Locale } from "../lib/i18n";
import type { DocumentAsset } from "../lib/types";

type DocumentTableProps = Readonly<{
  items: DocumentAsset[];
  locale?: Locale;
}>;

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
        <table className="data-table" aria-label={t.documentAssets}>
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
                  <td>{formatValue(item.type, locale, t.unknown)}</td>
                  <td>{item.sourceUri ?? t.stored}</td>
                  <td>
                    <span className="status-pill">
                      {formatValue(item.parseStatus, locale, t.pendingParse)}
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
