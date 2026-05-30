import React from "react";

import { copy, formatValue, localizedHref, type Locale } from "../lib/i18n";
import type { TestCaseRecord } from "../lib/types";

type TestCaseTableProps = Readonly<{
  items: TestCaseRecord[];
  locale?: Locale;
}>;

export function TestCaseTable({ items, locale = "zh" }: TestCaseTableProps) {
  const t = copy[locale].components;

  return (
    <section className="data-card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{t.draftInventory}</span>
          <h3>{t.testCaseDrafts}</h3>
        </div>
        <p>{t.testCaseIntro}</p>
      </div>

      <div className="table-scroll">
        <table className="data-table" aria-label={t.testCaseDrafts}>
          <thead>
            <tr>
              <th scope="col">{t.title}</th>
              <th scope="col">{t.module}</th>
              <th scope="col">{t.priority}</th>
              <th scope="col">{t.status}</th>
              <th scope="col">{t.review}</th>
            </tr>
          </thead>
          <tbody>
            {items.length ? (
              items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.title}</strong>
                    <div className="table-detail">
                      {formatValue(item.caseType, locale, t.case)} {t.for}{" "}
                      {item.feature}
                    </div>
                  </td>
                  <td>{item.module}</td>
                  <td>{formatValue(item.priority, locale, t.unspecified)}</td>
                  <td>
                    <span className="status-pill">
                      {formatValue(item.status, locale, t.draft)}
                    </span>
                  </td>
                  <td>
                    <a
                      className="table-link"
                      href={localizedHref(
                        `/projects/${item.projectId}/review?caseId=${item.id}`,
                        locale,
                      )}
                    >
                      {t.openReview}
                    </a>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="empty-cell">
                  {t.noCases}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
