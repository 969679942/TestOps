"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { copy, reviewActionLabels } from "../lib/copy";
import { formatDateTime } from "../lib/format";
import {
  addTestCaseReview,
  ApiError,
  publishTestCase,
  type ReviewRecord,
  type TestCaseRecord,
} from "../lib/workspace-api";
import { StatusBadge } from "./status-badge";

type TestCaseReviewPanelProps = Readonly<{
  testCase: TestCaseRecord;
  reviews: ReviewRecord[];
}>;

export function TestCaseReviewPanel({
  testCase: initialTestCase,
  reviews: initialReviews,
}: TestCaseReviewPanelProps) {
  const router = useRouter();
  const [testCase, setTestCase] = useState(initialTestCase);
  const [reviews, setReviews] = useState(initialReviews);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function runAction(action: "approve" | "request_change" | "reject" | "publish") {
    if (action === "reject" && !window.confirm(copy.confirmReject)) {
      return;
    }

    if (action === "publish" && !window.confirm(copy.confirmPublish)) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      if (action === "publish") {
        const published = await publishTestCase(testCase.id);
        setTestCase(published);
      } else {
        const review = await addTestCaseReview(testCase.id, {
          reviewerId: "qa.reviewer",
          action,
          comment: comment.trim() || undefined,
        });
        setReviews((current) => [...current, review]);
        setTestCase((current) => ({
          ...current,
          status:
            action === "approve"
              ? "approved"
              : action === "request_change"
                ? "needs_update"
                : "rejected",
        }));
      }

      setComment("");
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof ApiError ? actionError.message : copy.reviewActionFailed);
    } finally {
      setBusy(false);
    }
  }

  const canPublish = testCase.status === "approved";
  const isPublished = testCase.status === "published";

  return (
    <aside className="review-panel" aria-label="评审操作">
      <div className="review-panel-header">
        <div className="review-panel-header-copy">
          <span className="eyebrow">评审操作</span>
          <h3>审批与发布</h3>
          <p className="review-panel-copy">先完成评审动作，再决定是否将当前用例发布给后续自动化流程使用。</p>
        </div>
        <StatusBadge status={testCase.status} />
      </div>

      {!isPublished ? (
        <>
          <div className="review-flow-hint">
            <span className={testCase.status === "draft" ? "flow-step is-active" : "flow-step"}>
              {copy.flowApprove}
            </span>
            <span className={canPublish ? "flow-step is-active" : "flow-step"}>
              {copy.flowPublish}
            </span>
          </div>

          <label className="field">
            <span>{copy.reviewComment}</span>
            <textarea
              rows={4}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder={copy.reviewCommentPlaceholder}
            />
          </label>

          <div className="action-row review-panel-actions">
            <button
              className="button-primary"
              type="button"
              disabled={busy}
              onClick={() => runAction("approve")}
            >
              {copy.approve}
            </button>
            <button
              className="button-secondary"
              type="button"
              disabled={busy}
              onClick={() => runAction("request_change")}
            >
              {copy.requestChanges}
            </button>
            <button
              className="button-danger"
              type="button"
              disabled={busy}
              onClick={() => runAction("reject")}
            >
              {copy.reject}
            </button>
          </div>

          {canPublish ? (
            <div className="review-panel-publish">
              <p className="helper-text success">{copy.publishReady}</p>
              <button
                className="button-primary wide"
                type="button"
                disabled={busy}
                onClick={() => runAction("publish")}
              >
                {copy.publish}
              </button>
            </div>
          ) : (
            <p className="helper-text">{copy.publishHint}</p>
          )}
        </>
      ) : (
        <p className="helper-text">{copy.publishedLocked}</p>
      )}

      {error ? <p className="form-error">{error}</p> : null}

      <div className="review-history">
        <div className="review-history-header">
          <span className="eyebrow">{copy.reviewHistory}</span>
          <h4>处理记录</h4>
        </div>

        {reviews.length === 0 ? (
          <p className="helper-text">{copy.noReviewHistory}</p>
        ) : (
          <ul className="timeline">
            {reviews.map((review) => (
              <li key={review.id} className="timeline-item">
                <div className="timeline-item-header">
                  <strong>{reviewActionLabels[review.action] ?? review.action}</strong>
                  <span>{review.reviewerId}</span>
                </div>
                <time dateTime={review.createdAt}>{formatDateTime(review.createdAt)}</time>
                {review.comment ? <p>{review.comment}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
