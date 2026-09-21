"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Icon from "./Icon";
import { toast } from "@/lib/toast";
import { DAY_LABELS, type DaySchedule, type Schedule } from "@/lib/types";

const EMPTY_DAY: DaySchedule = { open: false, from: "09:00", to: "17:00" };

function normalize(schedule: Schedule | null): Record<string, DaySchedule> {
  const out: Record<string, DaySchedule> = {};
  for (const { key } of DAY_LABELS) {
    out[key] = { ...EMPTY_DAY, ...(schedule?.days?.[key] ?? {}) };
  }
  return out;
}

function fmtTime(t: string): string {
  const [hStr, m] = t.split(":");
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

export default function ScheduleEditor({
  sellerId,
  isOwner,
  schedule,
  available,
  responseRate,
}: {
  sellerId: string;
  isOwner: boolean;
  schedule: Schedule | null;
  available: boolean;
  responseRate: number;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState<Record<string, DaySchedule>>(() => normalize(schedule));
  const [note, setNote] = useState(schedule?.note ?? "");
  const [saving, setSaving] = useState(false);

  const liveDays = normalize(schedule);
  const hasHours = DAY_LABELS.some((d) => liveDays[d.key].open);

  function openModal() {
    setDays(normalize(schedule));
    setNote(schedule?.note ?? "");
    setOpen(true);
  }

  function updateDay(key: string, patch: Partial<DaySchedule>) {
    setDays((cur) => ({ ...cur, [key]: { ...cur[key], ...patch } }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload: Schedule = { note: note.trim() || undefined, days };
    const { error } = await supabase
      .from("profiles")
      .update({ schedule: payload })
      .eq("id", sellerId);
    setSaving(false);
    if (error) {
      toast("Couldn't save schedule — try again");
      return;
    }
    toast("Schedule updated");
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <div className="tab-fact-row">
        <div className="tab-fact">
          <strong>Availability</strong>
          {available ? "Available now" : "Not currently available"}
        </div>
        <div className="tab-fact">
          <strong>Response rate</strong>
          {responseRate}%
        </div>
      </div>

      {isOwner && (
        <button type="button" className="profile-edit-btn" style={{ marginBottom: 16 }} onClick={openModal}>
          <Icon name="Pencil" />
          {hasHours ? "Edit schedule" : "Set your schedule"}
        </button>
      )}

      {hasHours ? (
        <div className="schedule-list">
          {DAY_LABELS.map((d) => {
            const day = liveDays[d.key];
            return (
              <div className="schedule-row" key={d.key}>
                <span className="schedule-day">{d.label}</span>
                <span className={`schedule-hours${day.open ? "" : " closed"}`}>
                  {day.open ? `${fmtTime(day.from)} – ${fmtTime(day.to)}` : "Closed"}
                </span>
              </div>
            );
          })}
          {schedule?.note && <p className="schedule-note">{schedule.note}</p>}
        </div>
      ) : (
        !isOwner && (
          <div className="tab-empty">
            No fixed hours posted yet. Message the seller to arrange a time that works for you.
          </div>
        )
      )}

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
            <h2>Your schedule</h2>
            <form onSubmit={handleSave}>
              <div className="schedule-edit-list">
                {DAY_LABELS.map((d) => {
                  const day = days[d.key];
                  return (
                    <div className="schedule-edit-row" key={d.key}>
                      <label className="schedule-edit-day">
                        <input
                          type="checkbox"
                          checked={day.open}
                          onChange={(e) => updateDay(d.key, { open: e.target.checked })}
                        />
                        {d.label}
                      </label>
                      <input
                        type="time"
                        className="control schedule-time"
                        value={day.from}
                        disabled={!day.open}
                        onChange={(e) => updateDay(d.key, { from: e.target.value })}
                      />
                      <span className="schedule-dash">–</span>
                      <input
                        type="time"
                        className="control schedule-time"
                        value={day.to}
                        disabled={!day.open}
                        onChange={(e) => updateDay(d.key, { to: e.target.value })}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="field" style={{ marginTop: 16 }}>
                <label htmlFor="sched-note">Note (optional)</label>
                <input
                  className="control"
                  id="sched-note"
                  maxLength={120}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Closed on public holidays"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-line" onClick={() => setOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-accent" disabled={saving}>
                  {saving ? "Saving…" : "Save schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
