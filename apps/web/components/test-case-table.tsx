import React from "react";

import { copy, localizedHref, type Locale } from "../lib/i18n";
import type { TestCaseRecord } from "../lib/types";

type TestCaseTableProps = Readonly<{
  items: TestCaseRecord[];
  locale?: Locale;
}>;

function formatLabel(value: string, fallback: string) {
  if (!value) {
    return fallback;
  }

  return value
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function TestCaseTable({ items, locale = "en" }: TestCaseTableProps) {
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
        <table className="data-table" aria-label="Project test cases">
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
                      {formatLabel(item.caseType, t.case)} for {item.feature}
                    </div>
                  </td>
                  <td>{item.module}</td>
                  <td>{formatLabel(item.priority, t.unspecified)}</td>
                  <td>
                    <span className="status-pill">
                      {formatLabel(item.status, t.draft)}
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
