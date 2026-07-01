"use client";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Pencil, X, AlertCircle } from "lucide-react";
import { Card } from "@/app/components/ui/Card";
import { PushReminderCard } from "@/app/components/PushReminderCard";
import { useApp } from "@/app/store";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function formatElapsed(isoStart: string) {
  const diff = Date.now() - new Date(isoStart).getTime();
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return `${h}h ${m}m elapsed`;
}

// Sunday=0 … Thursday=4 are work days in Kuwait
const WORK_DAYS = new Set([0, 1, 2, 3, 4]);

export function DutyScreen() {
  const { state, set, showToast, fetchShifts, clockIn, clockOut, addOnCallShift } = useApp();
  const {
    clockedIn, clockInTime, activeShiftId, shifts,
    viewYear, viewMonth,
    dayShiftStart, dayShiftEnd,
    onCallOpen, onCallDate, onCallStart, onCallEnd,
  } = state;

  const [elapsed, setElapsed] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingTime, setEditingTime] = useState(false);
  const [onCallError, setOnCallError] = useState("");
  const [tmpStart, setTmpStart] = useState(dayShiftStart);
  const [tmpEnd,   setTmpEnd]   = useState(dayShiftEnd);

  // Live elapsed counter
  useEffect(() => {
    if (!clockedIn || !clockInTime) { setElapsed(""); return; }
    setElapsed(formatElapsed(clockInTime));
    const id = setInterval(() => setElapsed(formatElapsed(clockInTime)), 60_000);
    return () => clearInterval(id);
  }, [clockedIn, clockInTime]);

  // Fetch shifts whenever the viewed month changes
  useEffect(() => {
    fetchShifts(viewYear, viewMonth);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewYear, viewMonth]);

  // ── Calendar helpers ────────────────────────────────────────────────────────
  const today        = new Date();
  const isThisMonth  = today.getFullYear() === viewYear && today.getMonth() === viewMonth;
  const todayDate    = today.getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth    = new Date(viewYear, viewMonth + 1, 0).getDate();
  const totalWeeks     = Math.ceil((firstDayOfWeek + daysInMonth) / 7);

  // Group on-call shifts by calendar day
  const onCallByDay = new Map<number, typeof shifts[0][]>();
  // Group day shifts (clock-in/out records) by day
  const dayShiftByDay = new Map<number, typeof shifts[0]>();
  for (const s of shifts) {
    const d = new Date(s.clockedInAt);
    if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
      const day = d.getDate();
      if (s.type === "oncall") {
        if (!onCallByDay.has(day)) onCallByDay.set(day, []);
        onCallByDay.get(day)!.push(s);
      } else {
        dayShiftByDay.set(day, s); // last one wins if multiple
      }
    }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const completedShifts = shifts.filter((s) => s.clockedOutAt);
  const totalMs = completedShifts.reduce((acc, s) =>
    acc + (new Date(s.clockedOutAt!).getTime() - new Date(s.clockedInAt).getTime()), 0);
  const totalHours  = Math.round(totalMs / 3_600_000);
  const onCallCount = completedShifts.filter((s) => s.type === "oncall").length;
  const dayCount    = completedShifts.filter((s) => s.type === "day").length;

  // Compliance — Kuwait work days (Sun–Thu) covered in the viewed month
  let requiredWorkDays = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    if (WORK_DAYS.has(new Date(viewYear, viewMonth, d).getDay())) requiredWorkDays++;
  }
  const coveredWorkDays = new Set(
    shifts.filter((s) => s.type === "day" && WORK_DAYS.has(new Date(s.clockedInAt).getDay()))
          .map((s) => new Date(s.clockedInAt).getDate())
  ).size;
  const completedWorkDays = Math.min(coveredWorkDays, requiredWorkDays);
  const compliancePct = requiredWorkDays ? Math.round((completedWorkDays / requiredWorkDays) * 100) : 0;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleClockToggle = async () => {
    setBusy(true);
    try {
      if (clockedIn && activeShiftId) {
        await clockOut(activeShiftId);
        showToast("Clocked out — shift saved");
      } else {
        await clockIn();
        showToast("Clocked in successfully");
      }
    } finally { setBusy(false); }
  };

  const goMonth = (delta: number) => {
    let m = viewMonth + delta, y = viewYear;
    if (m < 0)  { m = 11; y--; }
    if (m > 11) { m = 0;  y++; }
    set({ viewMonth: m, viewYear: y });
  };

  const openOnCall = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    setOnCallError("");
    set({ onCallOpen: true, onCallDate: dateStr });
  };

  const handleAddOnCall = async () => {
    if (!onCallDate) return;
    setOnCallError("");
    setBusy(true);
    try {
      await addOnCallShift(onCallDate, onCallStart, onCallEnd);
      showToast("On-call shift added");
    } catch (e: unknown) {
      setOnCallError(e instanceof Error ? e.message : "Could not save shift. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "clamp(18px,3vw,26px) clamp(16px,3.5vw,32px)", position: "relative" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 18, letterSpacing: "-0.01em" }}>Duty tracker</h1>

      {/* ── On-call shift reminders (Web Push) ── */}
      <PushReminderCard />

      {/* ── Clock in/out ── */}
      <Card style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{
          width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
          background: clockedIn ? "var(--accent)" : "#C7CDD4",
        }} />
        <div style={{ flex: 1, minWidth: 100 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
            {clockedIn ? "On shift" : "Off shift"}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>
            {clockedIn && clockInTime
              ? `Started at ${formatTime(clockInTime)} · ${elapsed}`
              : completedShifts.length > 0
                ? `Last shift ended at ${formatTime(completedShifts[completedShifts.length - 1].clockedOutAt!)}`
                : "No shifts recorded yet"}
          </div>
        </div>
        <button
          onClick={handleClockToggle}
          disabled={busy}
          style={{
            height: 38, padding: "0 20px",
            background: clockedIn ? "transparent" : "var(--accent)",
            color: clockedIn ? "var(--major-text)" : "#fff",
            border: clockedIn ? "1.5px solid var(--major-text)" : "none",
            borderRadius: 9, cursor: busy ? "not-allowed" : "pointer",
            fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: 13.5,
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? "…" : clockedIn ? "Clock out" : "Clock in"}
        </button>
      </Card>

      {/* ── Day shift default time + Add on-call ── */}
      <Card style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{
            background: "var(--accent-soft)", color: "var(--accent-soft-text)",
            border: "1px solid var(--accent-border)", borderRadius: 999,
            fontSize: 11.5, fontWeight: 600, padding: "2px 10px",
          }}>
            Day shift · Sun – Thu
          </span>

          {editingTime ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="time" value={tmpStart}
                onChange={(e) => setTmpStart(e.target.value)}
                style={{ height: 32, border: "1px solid var(--input-border)", borderRadius: 7, padding: "0 8px", fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}
              />
              <span style={{ color: "var(--text-muted)", fontSize: 13 }}>–</span>
              <input
                type="time" value={tmpEnd}
                onChange={(e) => setTmpEnd(e.target.value)}
                style={{ height: 32, border: "1px solid var(--input-border)", borderRadius: 7, padding: "0 8px", fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}
              />
              <button
                onClick={() => { set({ dayShiftStart: tmpStart, dayShiftEnd: tmpEnd }); setEditingTime(false); }}
                style={{ height: 32, padding: "0 14px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 7, cursor: "pointer", fontFamily: "'IBM Plex Sans',sans-serif", fontWeight: 600, fontSize: 12.5 }}
              >
                Save
              </button>
              <button
                onClick={() => setEditingTime(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, color: "var(--text-primary)" }}>
                {dayShiftStart} – {dayShiftEnd}
              </span>
              <button
                onClick={() => { setTmpStart(dayShiftStart); setTmpEnd(dayShiftEnd); setEditingTime(true); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 2 }}
                title="Edit day shift time"
              >
                <Pencil size={13} />
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            const d = today;
            const pad = (n: number) => String(n).padStart(2, "0");
            setOnCallError("");
            set({
              onCallOpen: true,
              onCallDate: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
            });
          }}
          style={{
            height: 36, padding: "0 14px",
            background: "var(--indigo-bg)", color: "var(--indigo-text)",
            border: "1px solid var(--indigo-border)", borderRadius: 8,
            cursor: "pointer", fontFamily: "'IBM Plex Sans',sans-serif",
            fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 6,
          }}
        >
          <Plus size={13} /> Add on-call
        </button>
      </Card>

      {/* ── Summary ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 18 }}>
        {[
          { label: "Total hours logged", value: `${totalHours} hrs`, sub: "This month" },
          { label: "Day shifts", value: `${dayCount}`, sub: `${dayCount * 7} h total`, color: "var(--accent)" },
          { label: "On-call shifts", value: `${onCallCount}`, sub: "This month", color: "var(--indigo-text)" },
          { label: "Shifts completed", value: `${completedShifts.length}`, sub: "This month" },
        ].map((s) => (
          <Card key={s.label} style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color || "var(--text-primary)", marginBottom: 3 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{s.sub}</div>
          </Card>
        ))}
      </div>

      {/* ── Compliance progress ── */}
      <Card style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 170 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 7 }}>
            You&rsquo;ve completed{" "}
            <span style={{ color: "var(--accent-soft-text)" }}>{completedWorkDays} / {requiredWorkDays}</span>{" "}
            required shifts this month
          </div>
          <div style={{ height: 7, borderRadius: 99, background: "var(--border)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${compliancePct}%`, background: compliancePct >= 80 ? "var(--accent)" : "var(--amber-text)", borderRadius: 99, transition: "width 0.4s" }} />
          </div>
        </div>
        <span style={{ background: "var(--accent-soft)", color: "var(--accent-soft-text)", borderRadius: 999, padding: "4px 14px", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
          {compliancePct}%
        </span>
      </Card>

      {/* ── Legend ── */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
        {[
          { label: "Day shift (Sun–Thu)", color: "var(--accent)" },
          { label: "On call", color: "var(--indigo-text)" },
          { label: "Today", color: "var(--accent)", outline: true },
        ].map((l) => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)" }}>
            <div style={{
              width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
              background: l.outline ? "transparent" : l.color,
              border: l.outline ? `2px solid ${l.color}` : "none",
            }} />
            {l.label}
          </div>
        ))}
      </div>

      {/* ── Calendar ── */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {/* Month nav */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "var(--subtle-bg)",
        }}>
          <button onClick={() => goMonth(-1)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: "var(--text-secondary)", padding: 4, borderRadius: 6 }}>
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button onClick={() => goMonth(1)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: "var(--text-secondary)", padding: 4, borderRadius: 6 }}>
            <ChevronRight size={18} />
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <div className="cal-inner">
            {/* Day headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", borderBottom: "1px solid var(--border)" }}>
              {DAYS.map((d, i) => (
                <div key={d} style={{
                  padding: "8px", fontSize: 11.5, fontWeight: 600, textAlign: "center", letterSpacing: "0.04em",
                  color: (i === 5 || i === 6) ? "var(--text-faint)" : "var(--text-muted)",
                }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Week rows */}
            {Array.from({ length: totalWeeks }, (_, week) => (
              <div key={week} style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
                {DAYS.map((_, dayIdx) => {
                  const actualDay = week * 7 + dayIdx - firstDayOfWeek + 1;
                  if (actualDay < 1 || actualDay > daysInMonth) {
                    return <div key={dayIdx} className="cal-cell" style={{ minHeight: 90, borderRight: "1px solid var(--border-2)", borderBottom: "1px solid var(--border-2)", background: "var(--page-bg)" }} />;
                  }

                  const isToday  = isThisMonth && actualDay === todayDate;
                  const isOff    = dayIdx === 5 || dayIdx === 6; // Fri & Sat
                  const isWork   = WORK_DAYS.has(dayIdx);
                  const logged   = dayShiftByDay.get(actualDay);
                  const onCalls  = onCallByDay.get(actualDay) || [];

                  return (
                    <div
                      key={dayIdx}
                      className="cal-cell"
                      style={{
                        minHeight: 90, padding: "8px",
                        borderRight: "1px solid var(--border-2)",
                        borderBottom: "1px solid var(--border-2)",
                        background: isToday ? "var(--accent-soft)" : "var(--card-bg)",
                        outline: isToday ? "2px solid var(--accent)" : "none",
                        outlineOffset: -1,
                        position: "relative",
                      }}
                    >
                      {/* Day number */}
                      <div className="cal-daynum" style={{ fontSize: 12, fontWeight: 600, marginBottom: 5, color: isToday ? "var(--accent-soft-text)" : "var(--text-secondary)" }}>
                        {actualDay}
                      </div>

                      {/* Compact dots — mobile only (green = day shift, indigo = on-call) */}
                      {isWork && (
                        <div className="cal-dots" style={{ gap: 3, alignItems: "center", flexWrap: "wrap" }}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", display: "block", flexShrink: 0 }} />
                          {onCalls.map((s) => (
                            <span key={s.id} style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--indigo-text)", display: "block", flexShrink: 0 }} />
                          ))}
                        </div>
                      )}

                      {/* Detailed content — desktop / tablet */}
                      <div className="cal-detail">
                      {isOff ? (
                        <div style={{ fontSize: 10.5, color: "var(--text-faint)", border: "1px dashed var(--border)", borderRadius: 4, textAlign: "center", padding: "3px" }}>
                          Off
                        </div>
                      ) : isWork ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          {/* Day shift row — always shown for work days */}
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />
                            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "var(--text-primary)" }}>
                              {logged
                                ? `${formatTime(logged.clockedInAt)}${logged.clockedOutAt ? `–${formatTime(logged.clockedOutAt)}` : " (active)"}`
                                : `${dayShiftStart}–${dayShiftEnd}`}
                            </span>
                          </div>

                          {/* On-call shifts for this day */}
                          {onCalls.map((s) => (
                            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--indigo-text)", flexShrink: 0 }} />
                              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "var(--indigo-text)" }}>
                                {s.clockedOutAt
                                  ? `${formatTime(s.clockedInAt)}–${formatTime(s.clockedOutAt)}`
                                  : `${formatTime(s.clockedInAt)} (active)`}
                              </span>
                            </div>
                          ))}

                          {/* Quick add on-call button */}
                          <button
                            onClick={() => openOnCall(actualDay)}
                            style={{
                              marginTop: 2, background: "none", border: "none", cursor: "pointer",
                              color: "var(--indigo-text)", display: "flex", alignItems: "center", gap: 2,
                              fontSize: 9.5, fontWeight: 600, padding: 0,
                            }}
                          >
                            <Plus size={9} /> on-call
                          </button>
                        </div>
                      ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* ── Add on-call modal ── */}
      {onCallOpen && (
        <>
          <div
            onClick={() => set({ onCallOpen: false })}
            style={{ position: "fixed", inset: 0, background: "rgba(15,36,56,0.28)", zIndex: 300 }}
          />
          <div
            className="panel-animate"
            style={{
              position: "fixed", top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              width: "min(400px,calc(100vw - 32px))",
              background: "var(--card-bg)", borderRadius: 16, border: "1px solid var(--border)",
              boxShadow: "0 20px 50px -20px rgba(15,36,56,0.45)",
              padding: "24px 26px", zIndex: 301,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Add on-call shift</span>
              <button onClick={() => { setOnCallError(""); set({ onCallOpen: false }); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 5 }}>Date</label>
                <input
                  type="date"
                  value={onCallDate}
                  onChange={(e) => set({ onCallDate: e.target.value })}
                  style={{ display: "block", width: "100%", height: 40, border: "1px solid var(--input-border)", borderRadius: 8, padding: "0 12px", fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 13.5, outline: "none" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 5 }}>Start time</label>
                  <input
                    type="time"
                    value={onCallStart}
                    onChange={(e) => set({ onCallStart: e.target.value })}
                    style={{ display: "block", width: "100%", height: 40, border: "1px solid var(--input-border)", borderRadius: 8, padding: "0 12px", fontFamily: "'IBM Plex Mono',monospace", fontSize: 13.5, outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 5 }}>End time</label>
                  <input
                    type="time"
                    value={onCallEnd}
                    onChange={(e) => set({ onCallEnd: e.target.value })}
                    style={{ display: "block", width: "100%", height: 40, border: "1px solid var(--input-border)", borderRadius: 8, padding: "0 12px", fontFamily: "'IBM Plex Mono',monospace", fontSize: 13.5, outline: "none" }}
                  />
                </div>
              </div>

              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: -4 }}>
                Overnight shifts (e.g. 20:00 – 03:00) are handled automatically.
              </div>
            </div>

            {onCallError && (
              <div
                style={{
                  display: "flex", alignItems: "flex-start", gap: 8,
                  background: "var(--major-bg)", border: "1px solid #F0CFCB",
                  borderRadius: 8, padding: "9px 12px", marginTop: 12,
                }}
              >
                <AlertCircle size={14} color="var(--major-text)" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 12.5, color: "var(--major-text)", lineHeight: 1.5 }}>{onCallError}</span>
              </div>
            )}

            <button
              onClick={handleAddOnCall}
              disabled={busy || !onCallDate}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "100%", height: 42, marginTop: 22,
                background: "var(--indigo-text)", color: "#fff",
                border: "none", borderRadius: 9,
                cursor: busy || !onCallDate ? "not-allowed" : "pointer",
                fontFamily: "'IBM Plex Sans',sans-serif", fontWeight: 600, fontSize: 14,
                opacity: busy || !onCallDate ? 0.6 : 1,
              }}
            >
              {busy ? "Saving…" : "Add on-call shift"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
