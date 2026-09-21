"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getReviews } from "@/lib/data";
import { timeAgo } from "@/lib/format";
import Icon from "./Icon";
import { toast } from "@/lib/toast";
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
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [saving, setSaving] = useState(false);

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

  return (
    <>
      <div className="rating-big-row">
        <span className="rating-big">{avg.toFixed(1)}</span>
        <Stars value={avg} size={16} />
      </div>
      <p className="rating-count-line">
        Based on {count} {count === 1 ? "review" : "reviews"}
      </p>

      {userId === sellerId ? null : userId === null ? (
        <div className="review-form-box">
          <p className="hint" style={{ marginBottom: 10 }}>
            <Link href="/sign-in" style={{ color: "var(--brand)", fontWeight: 700 }}>
              Sign in
            </Link>{" "}
            to write a review.
          </p>
        </div>
      ) : userId ? (
        <form className="review-form-box" onSubmit={handleSubmit}>
          <p className="review-form-label">{myReview ? "Update your review" : "Write a review"}</p>
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
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
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
            placeholder="Share how the job went (optional)"
            maxLength={500}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button type="submit" className="btn btn-accent btn-block" disabled={saving || rating < 1}>
            {saving ? "Saving…" : myReview ? "Update review" : "Post review"}
          </button>
        </form>
      ) : null}

      {!loading && reviews.length === 0 && (
        <div className="tab-empty">No written reviews yet for this seller.</div>
      )}

      {reviews.length > 0 && (
        <div className="review-list">
          {reviews.map((r) => (
            <div className="review-row" key={r.id}>
              <div
                className="review-avatar"
                style={{ background: r.reviewer?.avatar_color ?? "var(--brand)" }}
              >
                {r.reviewer?.display_name?.charAt(0) ?? "?"}
              </div>
              <div className="review-body">
                <div className="review-head">
                  <span className="review-name">{r.reviewer?.display_name ?? "EzPz user"}</span>
                  <Stars value={r.rating} />
                  <span className="review-time">{timeAgo(r.created_at)}</span>
                </div>
                {r.comment && <p className="review-comment">{r.comment}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
