"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getReviews } from "@/lib/data";
import { timeAgo } from "@/lib/format";
import Icon from "./Icon";
import Avatar from "./Avatar";
import { toast } from "@/lib/toast";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Review } from "@/lib/types";

function Stars({ value, size = 13 }: { value: number; size?: number }) {
  const rounded = Math.round(value);
  return (
    <span className="rating-stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon
          key={n}
          name="Star"
          size={size}
          style={n > rounded ? { fill: "none", opacity: 0.35 } : undefined}
        />
      ))}
    </span>
  );
}

export default function ReviewsPanel({
  sellerId,
  initialRating,
  initialCount,
}: {
  sellerId: string;
  initialRating: number;
  initialCount: number;
}) {
  const supabase = createClient();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const COLLAPSED_COUNT = 3;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: userData }, list] = await Promise.all([
        supabase.auth.getUser(),
        getReviews(supabase, sellerId),
      ]);
      if (cancelled) return;
      setUserId(userData.user?.id ?? null);
      setReviews(list);
      const mine = userData.user ? list.find((r) => r.reviewer_id === userData.user!.id) : null;
      if (mine) {
        setRating(mine.rating);
        setComment(mine.comment);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerId]);

  const myReview = userId ? reviews.find((r) => r.reviewer_id === userId) : undefined;
  const count = loading ? initialCount : reviews.length;
  const avg =
    !loading && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : initialRating;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || rating < 1) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("reviews")
      .upsert(
        { seller_id: sellerId, reviewer_id: userId, rating, comment: comment.trim() },
        { onConflict: "seller_id,reviewer_id" }
      )
      .select("*, reviewer:profiles!reviews_reviewer_id_fkey(*)")
      .single();
    setSaving(false);
    if (error) {
      toast("Couldn't save your review — try again");
      return;
    }
    const saved = data as Review;
    setReviews((cur) => [saved, ...cur.filter((r) => r.reviewer_id !== userId)]);
    toast(myReview ? "Review updated" : "Review posted");
  }

  function focusMyReview() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function handleDelete() {
    if (!userId || !myReview) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("seller_id", sellerId)
      .eq("reviewer_id", userId);
    setDeleting(false);
    setConfirmDelete(false);
    if (error) {
      toast("Couldn't delete your review — try again");
      return;
    }
    setReviews((cur) => cur.filter((r) => r.reviewer_id !== userId));
    setRating(0);
    setComment("");
    toast("Review deleted");
  }

  return (
    <>
      <div className="rating-big-row">
        <span className="rating-big">{avg.toFixed(1)}</span>
        <Stars value={avg} size={16} />
      </div>
      <p className="rating-count-line">
        {t(count === 1 ? "reviews.basedOn_one" : "reviews.basedOn_other", { count })}
      </p>

      {userId === sellerId ? null : userId === null ? (
        <div className="review-form-box">
          <p className="hint" style={{ marginBottom: 10 }}>
            <Link href="/sign-in" style={{ color: "var(--brand)", fontWeight: 700 }}>
              {t("reviews.signInPrompt")}
            </Link>{" "}
            {t("reviews.signInSuffix")}
          </p>
        </div>
      ) : userId ? (
        <form className="review-form-box" onSubmit={handleSubmit} ref={formRef}>
          <p className="review-form-label">
            {myReview ? t("reviews.updateYourReview") : t("reviews.writeReview")}
          </p>
          <div
            className="star-picker"
            onMouseLeave={() => setHoverRating(0)}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                className="star-picker-btn"
                onMouseEnter={() => setHoverRating(n)}
                onClick={() => setRating(n)}
                aria-label={t(n > 1 ? "reviews.starLabel_other" : "reviews.starLabel_one", { count: n })}
              >
                <Icon
                  name="Star"
                  style={n > (hoverRating || rating) ? { fill: "none", opacity: 0.35 } : undefined}
                />
              </button>
            ))}
          </div>
          <textarea
            className="control"
            placeholder={t("reviews.commentPlaceholder")}
            maxLength={500}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button type="submit" className="btn btn-accent btn-block" disabled={saving || rating < 1}>
            {saving ? t("common.saving") : myReview ? t("reviews.updateReview") : t("reviews.postReview")}
          </button>
          {myReview && (
            <button
              type="button"
              className="btn btn-line btn-block"
              style={{ marginTop: 8, ...(confirmDelete ? { color: "#c0392b", borderColor: "#c0392b" } : undefined) }}
              onClick={handleDelete}
              disabled={deleting}
            >
              <Icon name="Trash2" />
              {deleting
                ? t("reviews.deleting")
                : confirmDelete
                  ? t("common.tapAgainConfirm")
                  : t("reviews.deleteMyReview")}
            </button>
          )}
        </form>
      ) : null}

      {!loading && reviews.length === 0 && (
        <div className="tab-empty">{t("reviews.noneYet")}</div>
      )}

      {reviews.length > 0 && (
        <div className="review-list">
          {(expanded ? reviews : reviews.slice(0, COLLAPSED_COUNT)).map((r) => (
            <div className="review-row" key={r.id}>
              <Avatar
                url={r.reviewer?.avatar_url}
                color={r.reviewer?.avatar_color ?? "var(--brand)"}
                name={r.reviewer?.display_name}
                className="review-avatar"
              />
              <div className="review-body">
                <div className="review-head">
                  <span className="review-name">
                    {r.reviewer?.display_name ?? t("reviews.ezpzUserFallback")}
                  </span>
                  <Stars value={r.rating} />
                  <span className="review-time">{timeAgo(r.created_at)}</span>
                  {userId && r.reviewer_id === userId && (
                    <button type="button" className="review-edit-link" onClick={focusMyReview}>
                      <Icon name="Pencil" />
                      {t("reviews.edit")}
                    </button>
                  )}
                </div>
                {r.comment && <p className="review-comment">{r.comment}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {reviews.length > COLLAPSED_COUNT && (
        <button
          type="button"
          className="btn btn-line btn-block review-toggle-btn"
          onClick={() => setExpanded((cur) => !cur)}
        >
          {expanded ? t("reviews.showFewerReviews") : t("reviews.showAllReviews", { count: reviews.length })}
          <Icon name="ChevronDown" size={16} style={expanded ? { transform: "rotate(180deg)" } : undefined} />
        </button>
      )}
    </>
  );
}
