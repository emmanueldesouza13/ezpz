"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Icon from "@/components/Icon";
import { toast } from "@/lib/toast";

const REASONS = [
  "Scam or fraud",
  "Fake or misleading listing",
  "Inappropriate content",
  "Spam",
  "Something else",
];

export default function ReportButton({ listingId }: { listingId: string }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { data: userData } = await supabase.auth.getUser();
    const fullReason = notes.trim() ? `${reason} — ${notes.trim()}` : reason;
    const { error } = await supabase.from("reports").insert({
      listing_id: listingId,
      reporter_id: userData.user?.id ?? null,
      reason: fullReason,
    });
    setSubmitting(false);
    if (error) {
      toast("Couldn't send your report — try again");
      return;
    }
    toast("Thanks — our team will review this listing.");
    setOpen(false);
    setNotes("");
    setReason(REASONS[0]);
  }

  return (
    <>
      <button type="button" className="report-link" onClick={() => setOpen(true)}>
        <Icon name="Flag" />
        Report this listing
      </button>

      {open && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="modal-card">
            <button type="button" className="modal-close" onClick={() => setOpen(false)}>
              <Icon name="X" />
            </button>
            <h2>Report this listing</h2>
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="report-reason">Reason</label>
                <select
                  className="control"
                  id="report-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                >
                  {REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field" style={{ marginBottom: 20 }}>
                <label htmlFor="report-notes">Details (optional)</label>
                <textarea
                  className="control"
                  id="report-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything else we should know?"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-line" onClick={() => setOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-accent" disabled={submitting}>
                  {submitting ? "Sending…" : "Send report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
