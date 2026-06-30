"use client";
import { useEffect, useState } from "react";
import { Inbox, Users } from "lucide-react";
import { Card } from "@/app/components/ui/Card";
import { useApp } from "@/app/store";

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  "Feature idea": { bg: "var(--accent-soft)",  text: "var(--accent-soft-text)", border: "var(--accent-border)" },
  "Bug report":   { bg: "var(--major-bg)",      text: "var(--major-text)",        border: "#F5C6C6" },
  "Complaint":    { bg: "var(--amber-bg)",       text: "var(--amber-text)",        border: "var(--amber-border)" },
  "General":      { bg: "var(--border-2)",       text: "var(--text-secondary)",    border: "var(--border)" },
};

function timeAgo(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)   return "Just now";
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days  < 7)   return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

export function AdminScreen() {
  const { state, fetchUsers, fetchFeedback, markFeedbackRead } = useApp();
  const [tab, setTab] = useState<"users" | "feedback">("users");

  useEffect(() => {
    if (tab === "users")    fetchUsers();
    if (tab === "feedback") fetchFeedback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const { userRows, usersLoading, feedbackItems, unreadFeedbackCount } = state;

  // ── Derived stats ──────────────────────────────────────────────────────────
  const now       = Date.now();
  const totalUsers   = userRows.length;
  const activeToday  = userRows.filter((u) => u.lastSeenAt && (now - new Date(u.lastSeenAt).getTime()) < 86_400_000).length;
  const activeWeek   = userRows.filter((u) => u.lastSeenAt && (now - new Date(u.lastSeenAt).getTime()) < 7 * 86_400_000).length;

  return (
    <div style={{ padding: "clamp(18px,3vw,26px) clamp(16px,3.5vw,32px)" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 3, letterSpacing: "-0.01em" }}>Admin dashboard</h1>
        <div style={{ fontSize: 13.5, color: "var(--text-secondary)" }}>Manage users and review feedback</div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid var(--border)" }}>
        {([
          { id: "users",    label: "Users",    icon: <Users size={14} /> },
          { id: "feedback", label: "Feedback", icon: <Inbox size={14} /> },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", marginBottom: -1,
              background: "none", border: "none",
              borderBottom: tab === t.id ? "2px solid var(--accent)" : "2px solid transparent",
              color: tab === t.id ? "var(--accent)" : "var(--text-secondary)",
              fontFamily: "'IBM Plex Sans',sans-serif",
              fontWeight: tab === t.id ? 600 : 400,
              fontSize: 13.5, cursor: "pointer",
            }}
          >
            {t.icon} {t.label}
            {t.id === "feedback" && unreadFeedbackCount > 0 && (
              <span style={{ background: "var(--major-text)", color: "#fff", borderRadius: 999, fontSize: 10, fontWeight: 700, padding: "1px 6px" }}>
                {unreadFeedbackCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Users tab ── */}
      {tab === "users" && (
        <>
          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 22 }}>
            <Card>
              <div style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>Total signed up</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "var(--text-primary)" }}>{usersLoading ? "—" : totalUsers}</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 3 }}>Registered accounts</div>
            </Card>
            <Card>
              <div style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>Active today</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "var(--accent)" }}>{usersLoading ? "—" : activeToday}</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 3 }}>Signed in the last 24 h</div>
            </Card>
            <Card>
              <div style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>Active this week</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "var(--accent)" }}>{usersLoading ? "—" : activeWeek}</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 3 }}>Signed in the last 7 days</div>
            </Card>
          </div>

          {/* User list */}
          {usersLoading ? (
            <Card style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-muted)", fontSize: 13.5 }}>
              Loading users…
            </Card>
          ) : userRows.length === 0 ? (
            <Card style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-muted)", fontSize: 13.5 }}>
              No users yet
            </Card>
          ) : (
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", minWidth: 520, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--subtle-bg)", borderBottom: "1px solid var(--border)" }}>
                      {["User", "Role", "Joined", "Last seen"].map((h) => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {userRows.map((u, i) => {
                      const seenRecently = u.lastSeenAt && (now - new Date(u.lastSeenAt).getTime()) < 86_400_000;
                      return (
                        <tr key={u.id} style={{ borderBottom: "1px solid var(--border-2)", background: i % 2 === 0 ? "var(--card-bg)" : "var(--subtle-bg)" }}>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{
                                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                                background: "var(--accent-soft)", border: "1.5px solid var(--accent-border)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 11, fontWeight: 700, color: "var(--accent-soft-text)",
                              }}>
                                {initials(u.fullName)}
                              </div>
                              <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-primary)" }}>{u.fullName}</span>
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{
                              background: u.role === "Employee" ? "var(--accent-soft)" : "var(--indigo-bg)",
                              color:      u.role === "Employee" ? "var(--accent-soft-text)" : "var(--indigo-text)",
                              border:     `1px solid ${u.role === "Employee" ? "var(--accent-border)" : "var(--indigo-border)"}`,
                              borderRadius: 999, fontSize: 11.5, fontWeight: 600, padding: "2px 9px",
                            }}>
                              {u.role}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-secondary)" }}>
                            {new Date(u.joinedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                              <div style={{ width: 7, height: 7, borderRadius: "50%", background: seenRecently ? "var(--accent)" : "var(--text-faint)", flexShrink: 0 }} />
                              <span style={{ fontSize: 13, color: seenRecently ? "var(--text-primary)" : "var(--text-muted)", fontWeight: seenRecently ? 500 : 400 }}>
                                {timeAgo(u.lastSeenAt)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {/* ── Feedback tab ── */}
      {tab === "feedback" && (
        <>
          {feedbackItems.length === 0 ? (
            <Card style={{ textAlign: "center", padding: "56px 20px" }}>
              <Inbox size={28} color="var(--text-faint)" style={{ marginBottom: 10 }} />
              <div style={{ fontSize: 14, color: "var(--text-muted)" }}>No feedback yet</div>
              <div style={{ fontSize: 13, color: "var(--text-faint)", marginTop: 4 }}>Submissions from users will appear here</div>
            </Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {feedbackItems.map((item) => {
                const catStyle = CATEGORY_STYLES[item.category] || CATEGORY_STYLES["General"];
                return (
                  <Card key={item.id} style={{ borderLeft: item.read ? "3px solid var(--border)" : "3px solid var(--accent)", opacity: item.read ? 0.8 : 1 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                          <span style={{ background: catStyle.bg, color: catStyle.text, border: `1px solid ${catStyle.border}`, borderRadius: 999, fontSize: 11, fontWeight: 600, padding: "2px 9px" }}>
                            {item.category}
                          </span>
                          {!item.read && (
                            <span style={{ background: "var(--accent)", color: "#fff", borderRadius: 999, fontSize: 10, fontWeight: 700, padding: "1px 7px" }}>New</span>
                          )}
                          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.userName} · {item.userRole}</span>
                          <span style={{ fontSize: 11.5, color: "var(--text-faint)", marginLeft: "auto" }}>
                            {new Date(item.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                            {" · "}{new Date(item.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p style={{ fontSize: 13.5, color: "var(--text-primary)", margin: 0, lineHeight: 1.65 }}>{item.message}</p>
                      </div>
                      {!item.read && (
                        <button
                          onClick={() => markFeedbackRead(item.id)}
                          style={{ flexShrink: 0, height: 32, padding: "0 12px", background: "var(--subtle-bg)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: 7, cursor: "pointer", fontFamily: "'IBM Plex Sans',sans-serif", fontWeight: 500, fontSize: 12, whiteSpace: "nowrap" }}
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
