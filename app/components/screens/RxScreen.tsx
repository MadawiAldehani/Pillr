"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Save, ExternalLink, Flag, X, AlertCircle } from "lucide-react";
import { Card } from "@/app/components/ui/Card";
import { SegmentedControl } from "@/app/components/ui/SegmentedControl";
import { SeverityBadge } from "@/app/components/ui/Badge";
import { useApp, ChatMode, Severity } from "@/app/store";
import { createClient } from "@/lib/supabase";

function ThinkingDots() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "6px 0" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="bounce-dot"
          style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "var(--accent)",
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
      <span style={{ fontSize: 12.5, color: "var(--text-muted)", marginLeft: 4 }}>
        Checking Wolters Kluwer CDI and Drugs.com…
      </span>
    </div>
  );
}

// localStorage key — bump the suffix (v2, v3…) to re-show the notice after a policy change
const AI_CONSENT_KEY = "pillr_rx_ai_consent_v1";

export function RxScreen() {
  const { state, set, showToast, addCase } = useApp();
  const [input, setInput] = useState("");
  const [consentDismissed, setConsentDismissed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem(AI_CONSENT_KEY) === "1",
  );
  const [diseaseInput, setDiseaseInput] = useState("");
  const [allergyInput, setAllergyInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const showPreg =
    state.patientSex === "Female" &&
    Number(state.patientAge) >= 18 &&
    Number(state.patientAge) <= 55;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages, state.isThinking]);

  const handleSend = async () => {
    if (!input.trim() || state.isThinking) return;
    const supabase = createClient();
    const query = input.trim();

    const userMsg = {
      id: `m${Date.now()}`,
      role: "user" as const,
      content: query,
      mode: state.chatMode,
    };

    const currentMessages = [...state.messages, userMsg];
    set({ messages: currentMessages, isThinking: true });
    setInput("");

    try {
      const { data, error } = await supabase.functions.invoke("rx-assistant", {
        body: {
          mode: state.chatMode,
          query,
          patientContext: state.chatMode === "interaction" ? {
            sex: state.patientSex,
            age: state.patientAge,
            preg: state.patientPreg,
            diseases: state.patientDiseases,
            allergies: state.patientAllergies,
          } : undefined,
        },
      });

      if (error) throw new Error(error.message);

      const patientCtxLine = state.chatMode === "interaction"
        ? `assessed for ${state.patientAge} y · ${state.patientSex.toLowerCase()}`
          + (showPreg ? ` · ${state.patientPreg.toLowerCase()}` : "")
          + (state.patientDiseases.length ? ` · ${state.patientDiseases.join(", ")}` : "")
          + (state.patientAllergies.length ? ` · allergy: ${state.patientAllergies.join(", ")}` : "")
        : undefined;

      const aiMsg = {
        id: `m${Date.now() + 1}`,
        role: "assistant" as const,
        content: data.explanation ?? "",
        mode: state.chatMode,
        severity: (data.severity as Severity) ?? undefined,
        patientContext: patientCtxLine,
        counselling: data.counselling ?? undefined,
        keyPoints: data.keyPoints ?? undefined,
        sources: ["https://store.wolterskluwercdi.com/CDI", "https://www.drugs.com/"],
      };

      set({
        messages: [...currentMessages, aiMsg],
        isThinking: false,
        historyList: [
          { id: `h${Date.now()}`, label: query.slice(0, 36), mode: state.chatMode },
          ...state.historyList,
        ],
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      const errorAiMsg = {
        id: `m${Date.now() + 1}`,
        role: "assistant" as const,
        content: `__error__:${errMsg}`,
        mode: state.chatMode,
      };
      set({ messages: [...currentMessages, errorAiMsg], isThinking: false });
    }
  };

  const handleSaveCase = async () => {
    const lastAI = [...state.messages].reverse().find((m) => m.role === "assistant");
    if (!lastAI) return;
    await addCase({
      meds: state.messages.findLast((m) => m.role === "user")?.content ?? "",
      severity: lastAI.severity ?? "None",
      drp: false,
      flagged: false,
      counsel: lastAI.counselling?.[0] ?? "",
      source: "Rx",
      countOnly: false,
    });
    showToast("Case saved to log");
  };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* History pane */}
      <div
        className="chat-history"
        style={{
          width: "clamp(240px,28%,300px)",
          borderRight: "1px solid var(--border)",
          background: "var(--subtle-bg)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          overflowY: "auto",
        }}
      >
        <div style={{ padding: "16px 14px 10px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Recent chats
          </div>
        </div>
        {state.historyList.map((h) => (
          <button
            key={h.id}
            onClick={() => set({ activeHistoryId: h.id })}
            style={{
              textAlign: "left",
              padding: "11px 14px",
              border: "none",
              borderBottom: "1px solid var(--border-2)",
              cursor: "pointer",
              background: state.activeHistoryId === h.id ? "var(--accent-soft)" : "transparent",
              borderLeft: state.activeHistoryId === h.id ? "3px solid var(--accent)" : "3px solid transparent",
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {h.label}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
              {h.mode === "interaction" ? "Interaction check" : "Clinical Q&A"}
            </div>
          </button>
        ))}
      </div>

      {/* Main chat */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header tabs */}
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "#fff",
          }}
        >
          <div style={{ display: "flex", gap: 4, background: "var(--border-2)", padding: 3, borderRadius: 10 }}>
            {(["interaction", "question"] as ChatMode[]).map((mode) => {
              const active = state.chatMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => set({ chatMode: mode })}
                  style={{
                    padding: "6px 16px",
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontWeight: active ? 600 : 400,
                    fontSize: 13,
                    background: active ? "#fff" : "transparent",
                    color: active ? "var(--accent-soft-text)" : "var(--text-secondary)",
                    boxShadow: active ? "0 1px 4px rgba(15,36,56,0.10)" : "none",
                    transition: "all 0.15s",
                  }}
                >
                  {mode === "interaction" ? "Interaction check" : "Ask a question"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>

          {/* ── AI processing notice (OWASP LLM privacy — shown once until dismissed) ── */}
          {!consentDismissed && (
            <div style={{
              background: "var(--amber-bg)",
              border: "1px solid var(--amber-border)",
              borderRadius: 10,
              padding: "13px 16px",
              marginBottom: 18,
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
            }}>
              <AlertCircle size={16} color="var(--amber-text)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--amber-text)", marginBottom: 4 }}>
                  External AI processing
                </div>
                <div style={{ fontSize: 12.5, color: "var(--amber-text)", lineHeight: 1.6, marginBottom: 10 }}>
                  Queries and patient context (medications, age, sex, conditions) you enter here are sent to an external AI service for processing.{" "}
                  <strong>Do not enter patient names, ID numbers, or any identifying information.</strong>
                </div>
                <button
                  onClick={() => {
                    localStorage.setItem(AI_CONSENT_KEY, "1");
                    setConsentDismissed(true);
                  }}
                  style={{
                    height: 30, padding: "0 14px",
                    background: "var(--amber-text)", color: "#fff",
                    border: "none", borderRadius: 7,
                    cursor: "pointer",
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontWeight: 600, fontSize: 12,
                  }}
                >
                  I understand
                </button>
              </div>
            </div>
          )}

          {/* Patient context (interaction mode only) */}
          {state.chatMode === "interaction" && (
            <Card style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>Patient context</span>
                <span
                  style={{
                    background: "var(--amber-bg)", color: "var(--amber-text)",
                    border: "1px solid var(--amber-border)",
                    borderRadius: 999, fontSize: 11.5, padding: "2px 10px", fontWeight: 500,
                  }}
                >
                  No names or identifying data
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
                {/* Gender */}
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 5, fontWeight: 500 }}>Gender</div>
                  <SegmentedControl
                    options={["Male", "Female"]}
                    value={state.patientSex}
                    onChange={(v) => set({ patientSex: v as "Male" | "Female" })}
                    size="sm"
                  />
                </div>
                {/* Age */}
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 5, fontWeight: 500 }}>Age</div>
                  <input
                    type="number"
                    value={state.patientAge}
                    onChange={(e) => set({ patientAge: e.target.value })}
                    style={{
                      width: 72, height: 32, border: "1px solid var(--input-border)",
                      borderRadius: 8, padding: "0 10px", textAlign: "center",
                      fontFamily: "'IBM Plex Mono', monospace", fontSize: 13.5, fontWeight: 500,
                      outline: "none",
                    }}
                  />
                </div>
                {/* Pregnancy */}
                {showPreg && (
                  <div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 5, fontWeight: 500 }}>Pregnancy</div>
                    <SegmentedControl
                      options={["Not pregnant", "Pregnant", "Breastfeeding"]}
                      value={state.patientPreg}
                      onChange={(v) => set({ patientPreg: v as "Not pregnant" | "Pregnant" | "Breastfeeding" })}
                      size="sm"
                    />
                  </div>
                )}
              </div>
              {/* Diseases */}
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 500 }}>Chronic diseases</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {state.patientDiseases.map((d) => (
                    <span
                      key={d}
                      style={{
                        display: "flex", alignItems: "center", gap: 4,
                        background: "var(--accent-soft)", color: "var(--accent-soft-text)",
                        border: "1px solid var(--accent-border)",
                        borderRadius: 999, padding: "3px 10px", fontSize: 12.5, fontWeight: 500,
                      }}
                    >
                      {d}
                      <button
                        onClick={() => set({ patientDiseases: state.patientDiseases.filter((x) => x !== d) })}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: "var(--accent-soft-text)" }}
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                  <div style={{ display: "flex", gap: 4 }}>
                    <input
                      value={diseaseInput}
                      onChange={(e) => setDiseaseInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && diseaseInput.trim()) {
                          set({ patientDiseases: [...state.patientDiseases, diseaseInput.trim()] });
                          setDiseaseInput("");
                        }
                      }}
                      placeholder="+ Add"
                      style={{
                        height: 28, border: "1px dashed var(--accent-border)", borderRadius: 999,
                        padding: "0 10px", fontSize: 12.5, outline: "none",
                        background: "transparent", color: "var(--accent-soft-text)",
                        fontFamily: "'IBM Plex Sans', sans-serif", width: 90,
                      }}
                    />
                  </div>
                </div>
              </div>
              {/* Allergies */}
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 500 }}>Allergies</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {state.patientAllergies.map((a) => (
                    <span
                      key={a}
                      style={{
                        display: "flex", alignItems: "center", gap: 4,
                        background: "var(--major-bg)", color: "var(--major-text)",
                        border: "1px solid #F0CFCB",
                        borderRadius: 999, padding: "3px 10px", fontSize: 12.5, fontWeight: 500,
                      }}
                    >
                      {a}
                      <button
                        onClick={() => set({ patientAllergies: state.patientAllergies.filter((x) => x !== a) })}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: "var(--major-text)" }}
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                  <input
                    value={allergyInput}
                    onChange={(e) => setAllergyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && allergyInput.trim()) {
                        set({ patientAllergies: [...state.patientAllergies, allergyInput.trim()] });
                        setAllergyInput("");
                      }
                    }}
                    placeholder="+ Add"
                    style={{
                      height: 28, border: "1px dashed #F0CFCB", borderRadius: 999,
                      padding: "0 10px", fontSize: 12.5, outline: "none",
                      background: "transparent", color: "var(--major-text)",
                      fontFamily: "'IBM Plex Sans', sans-serif", width: 90,
                    }}
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Messages */}
          {state.messages.map((msg) => {
            if (msg.role === "user") {
              return (
                <div key={msg.id} style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                  <div
                    style={{
                      background: "var(--navy)",
                      color: "#fff",
                      borderRadius: "14px 14px 4px 14px",
                      padding: "11px 16px",
                      maxWidth: "72%",
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 13.5,
                      lineHeight: 1.55,
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            }

            // Error message
            if (msg.content.startsWith("__error__:")) {
              return (
                <div key={msg.id} style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "flex-start" }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--major-bg)", border: "1.5px solid #F0CFCB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <AlertCircle size={14} color="var(--major-text)" />
                  </div>
                  <Card style={{ flex: 1, padding: "12px 16px", background: "var(--major-bg)", border: "1px solid #F0CFCB" }}>
                    <div style={{ fontSize: 13, color: "var(--major-text)", fontWeight: 600, marginBottom: 4 }}>Something went wrong</div>
                    <div style={{ fontSize: 12.5, color: "var(--major-text)", opacity: 0.8 }}>{msg.content.replace("__error__:", "")}</div>
                  </Card>
                </div>
              );
            }

            return (
              <div key={msg.id} style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "flex-start" }}>
                {/* Avatar */}
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--accent-soft)", border: "1.5px solid var(--accent-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <div style={{ width: 10, height: 6, borderRadius: 99, background: "var(--accent)", boxShadow: "inset -5px 0 0 var(--accent-dark)", transform: "rotate(-45deg)" }} />
                </div>
                <Card style={{ flex: 1, padding: "14px 16px" }}>
                  {/* Severity + context (interaction) */}
                  {msg.severity && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                      <SeverityBadge sev={msg.severity} />
                      {msg.patientContext && (
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{msg.patientContext}</span>
                      )}
                    </div>
                  )}

                  {/* Explanation */}
                  <p style={{ fontSize: 13.5, lineHeight: 1.65, color: "var(--text-primary)", margin: 0, marginBottom: (msg.counselling || msg.keyPoints) ? 14 : 0 }}>
                    {msg.content}
                  </p>

                  {/* Patient counselling (interaction mode) */}
                  {msg.counselling && (
                    <div style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-border)", borderRadius: 9, padding: "12px 14px", marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-soft-text)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Patient counselling
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 5 }}>
                        {msg.counselling.map((c, i) => (
                          <li key={i} style={{ fontSize: 13, color: "var(--accent-soft-text)", lineHeight: 1.5 }}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Key points (question mode) */}
                  {msg.keyPoints && (
                    <div style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-border)", borderRadius: 9, padding: "12px 14px", marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-soft-text)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Key points
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 5 }}>
                        {msg.keyPoints.map((p, i) => (
                          <li key={i} style={{ fontSize: 13, color: "var(--accent-soft-text)", lineHeight: 1.5 }}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Sources + flag */}
                  {msg.sources && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Sources</span>
                      {[
                        { url: msg.sources[0], label: "Wolters Kluwer CDI" },
                        { url: msg.sources[1], label: "Drugs.com" },
                      ].map((s) => (
                        <a key={s.url} href={s.url} target="_blank" rel="noreferrer"
                          style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, color: "var(--accent-soft-text)", background: "var(--accent-soft)", border: "1px solid var(--accent-border)", borderRadius: 999, padding: "3px 10px", textDecoration: "none", fontWeight: 500 }}
                        >
                          <ExternalLink size={11} />
                          {s.label}
                        </a>
                      ))}
                      <button
                        onClick={() => showToast("Flagged for doctor follow-up")}
                        style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 12px", cursor: "pointer", fontSize: 12.5, color: "var(--text-secondary)", fontFamily: "'IBM Plex Sans', sans-serif" }}
                      >
                        <Flag size={11} />
                        Flag for doctor follow-up
                      </button>
                    </div>
                  )}
                </Card>
              </div>
            );
          })}

          {/* Thinking */}
          {state.isThinking && (
            <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "flex-start" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--accent-soft)", border: "1.5px solid var(--accent-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <div style={{ width: 10, height: 6, borderRadius: 99, background: "var(--accent)", boxShadow: "inset -5px 0 0 var(--accent-dark)", transform: "rotate(-45deg)" }} />
              </div>
              <Card style={{ padding: "14px 16px" }}>
                <ThinkingDots />
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Composer */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid var(--border)",
            background: "#fff",
            display: "flex",
            gap: 8,
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={
              state.chatMode === "interaction"
                ? "Drug A + Drug B · e.g. Warfarin + Aspirin 100mg"
                : "Ask a clinical question…"
            }
            style={{
              flex: 1, height: 42,
              border: "1px solid var(--input-border)", borderRadius: 9,
              padding: "0 14px",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 13.5, outline: "none",
              color: "var(--text-primary)",
            }}
          />
          <button
            onClick={handleSend}
            style={{
              width: 42, height: 42, borderRadius: 9, border: "none",
              background: "var(--accent)", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Send size={16} strokeWidth={2} />
          </button>
          <button
            onClick={handleSaveCase}
            style={{
              height: 42, padding: "0 16px", borderRadius: 9,
              background: "var(--navy)", color: "#fff", border: "none",
              display: "flex", alignItems: "center", gap: 7,
              cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif",
              fontWeight: 600, fontSize: 13.5,
            }}
          >
            <Save size={15} strokeWidth={2} />
            Save case
          </button>
        </div>
      </div>
    </div>
  );
}
