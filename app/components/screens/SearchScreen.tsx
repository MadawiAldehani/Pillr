"use client";
import { useState, useEffect } from "react";
import { Search, ArrowLeft, ExternalLink, Shield, Loader } from "lucide-react";
import { Card } from "@/app/components/ui/Card";
import { useApp } from "@/app/store";
import { createClient } from "@/lib/supabase";

// ── Drug monograph data (rich clinical view for the 6 main drugs) ─────────────
const monographs: Record<string, {
  drugClass: string;
  dose: string;
  pregnancy: string;
  contraindications: string[];
  interactions: string[];
}> = {
  Warfarin: {
    drugClass: "Anticoagulant · Vitamin K antagonist",
    dose: "Individualized; typical maintenance 2–10 mg/day orally. Adjust to INR target (usually 2.0–3.0).",
    pregnancy: "Contraindicated in 1st trimester and near term. Use LMWH as alternative.",
    contraindications: ["Active bleeding", "Recent CNS surgery", "Severe hepatic impairment", "Pregnancy (1st trimester / near term)"],
    interactions: ["NSAIDs — increased bleeding risk", "Aspirin — potentiates anticoagulant effect", "Clarithromycin — inhibits CYP2C9, raises INR", "Rifampicin — induces CYP2C9, lowers INR"],
  },
  Metformin: {
    drugClass: "Biguanide · Antidiabetic",
    dose: "500–2000 mg/day orally in divided doses with meals. Max 3000 mg/day.",
    pregnancy: "Generally safe in pregnancy (T2DM/GDM). Monitor closely.",
    contraindications: ["eGFR < 30 mL/min/1.73 m²", "Acute/chronic metabolic acidosis", "Iodinated contrast (withhold 48 h)", "Hepatic impairment"],
    interactions: ["Ibuprofen/NSAIDs — risk of renal impairment", "Contrast agents — lactic acidosis risk", "Alcohol — increased lactic acidosis risk"],
  },
  Amoxicillin: {
    drugClass: "Aminopenicillin · Antibacterial",
    dose: "250–500 mg three times daily orally. Severe infections: 875 mg twice daily.",
    pregnancy: "Generally safe throughout pregnancy. Penicillins preferred.",
    contraindications: ["Penicillin hypersensitivity", "Infectious mononucleosis (risk of rash)", "History of amoxicillin-associated jaundice"],
    interactions: ["Warfarin — may potentiate anticoagulant effect", "Oral contraceptives — theoretical reduction of efficacy", "Methotrexate — reduced renal excretion"],
  },
  Tramadol: {
    drugClass: "Opioid analgesic · μ-agonist / SNRI",
    dose: "50–100 mg every 4–6 hours as needed. Max 400 mg/day. Reduce dose in renal/hepatic impairment.",
    pregnancy: "Avoid near term — neonatal withdrawal risk. Use only if benefit > risk.",
    contraindications: ["Concurrent MAOIs", "Severe respiratory depression", "Epilepsy (lowers seizure threshold)", "Acute intoxication (alcohol/opioids)"],
    interactions: ["SSRIs/SNRIs — serotonin syndrome risk", "MAOIs — severe serotonin syndrome", "Carbamazepine — reduced tramadol efficacy"],
  },
  Clarithromycin: {
    drugClass: "Macrolide antibiotic · CYP3A4 inhibitor",
    dose: "250–500 mg twice daily orally for 7–14 days depending on indication.",
    pregnancy: "Avoid — associated with adverse outcomes (especially T1). Azithromycin preferred.",
    contraindications: ["QT prolongation or concurrent QT-prolonging drugs", "Hepatic impairment with renal impairment combined", "History of cholestatic jaundice with clarithromycin"],
    interactions: ["Warfarin — inhibits CYP2C9, increases INR", "Statins — myopathy risk (avoid simvastatin/lovastatin)", "Digoxin — increased digoxin levels", "Colchicine — serious toxicity"],
  },
  Ibuprofen: {
    drugClass: "NSAID · COX-1/2 inhibitor",
    dose: "200–400 mg every 4–6 hours orally. Max 1200 mg/day OTC; 2400–3200 mg/day Rx.",
    pregnancy: "Avoid after 20 weeks — risk of fetal renal dysfunction. Contraindicated ≥30 weeks.",
    contraindications: ["Active peptic ulcer", "Severe heart failure", "Severe renal impairment (eGFR < 30)", "Aspirin hypersensitivity with asthma triad"],
    interactions: ["Warfarin — increased bleeding risk", "ACE inhibitors/ARBs — reduced antihypertensive effect and nephrotoxicity", "Metformin — renal impairment risk", "Aspirin — antagonises cardioprotective effect of low-dose aspirin"],
  },
};

const DRUG_CHIPS = ["Warfarin", "Metformin", "Amoxicillin", "Tramadol", "Clarithromycin", "Ibuprofen"];
const MONOGRAPH_LOWER = new Set(Object.keys(monographs).map((k) => k.toLowerCase()));

// ── Type for search_drugs RPC result ─────────────────────────────────────────
interface DrugResult {
  id: string;
  generic_name: string;
  brand_names: string[] | null;
  atc_code: string | null;
  atc_name: string | null;
  rxcui: string | null;
  representative_ndc: string | null;
  strength: string | null;
  dosage_form: string | null;
  route: string | null;
  is_controlled: boolean;
}

// ── Monograph view ────────────────────────────────────────────────────────────
function MonographView({ drug, mono, onBack }: {
  drug: string;
  mono: typeof monographs[string];
  onBack: () => void;
}) {
  return (
    <>
      <button
        onClick={onBack}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "none", border: "none", cursor: "pointer",
          color: "var(--accent)", fontWeight: 600, fontSize: 13.5,
          fontFamily: "'IBM Plex Sans', sans-serif",
          marginBottom: 20, padding: 0,
        }}
      >
        <ArrowLeft size={15} />
        Back to search
      </button>

      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <h1
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 22, fontWeight: 600,
              letterSpacing: "-0.01em", marginBottom: 4,
            }}
          >
            {drug}
          </h1>
          <span
            style={{
              background: "var(--accent-soft)", color: "var(--accent-soft-text)",
              border: "1px solid var(--accent-border)",
              borderRadius: 999, fontSize: 12, padding: "3px 12px", fontWeight: 500,
            }}
          >
            {mono.drugClass}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
        <Card>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>Typical dose</div>
          <p style={{ fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.65, margin: 0 }}>{mono.dose}</p>
        </Card>
        <Card>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>Pregnancy</div>
          <p style={{ fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.65, margin: 0 }}>{mono.pregnancy}</p>
        </Card>
        <Card>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>Key contraindications</div>
          <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 5 }}>
            {mono.contraindications.map((c) => (
              <li key={c} style={{ fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.5 }}>{c}</li>
            ))}
          </ul>
        </Card>
        <Card>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>Common interactions</div>
          <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 5 }}>
            {mono.interactions.map((i) => (
              <li key={i} style={{ fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.5 }}>{i}</li>
            ))}
          </ul>
        </Card>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18 }}>
        <span style={{ fontSize: 12.5, color: "var(--text-muted)", fontWeight: 500 }}>Sources</span>
        {[
          { url: "https://store.wolterskluwercdi.com/CDI", label: "Wolters Kluwer CDI" },
          { url: "https://www.drugs.com/", label: "Drugs.com" },
        ].map((s) => (
          <a
            key={s.url}
            href={s.url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: 4,
              fontSize: 12.5, color: "var(--accent-soft-text)",
              background: "var(--accent-soft)", border: "1px solid var(--accent-border)",
              borderRadius: 999, padding: "4px 12px", textDecoration: "none", fontWeight: 500,
            }}
          >
            <ExternalLink size={11} />
            {s.label}
          </a>
        ))}
      </div>
    </>
  );
}

// ── Basic DB drug card (for non-monograph drugs) ──────────────────────────────
function DbDrugView({ drug, onBack }: { drug: DrugResult; onBack: () => void }) {
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const dailyMedUrl = `https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=${encodeURIComponent(drug.generic_name)}`;

  return (
    <>
      <button
        onClick={onBack}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "none", border: "none", cursor: "pointer",
          color: "var(--accent)", fontWeight: 600, fontSize: 13.5,
          fontFamily: "'IBM Plex Sans', sans-serif",
          marginBottom: 20, padding: 0,
        }}
      >
        <ArrowLeft size={15} />
        Back to search
      </button>

      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <h1
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 22, fontWeight: 600,
              letterSpacing: "-0.01em", marginBottom: 4,
            }}
          >
            {capitalize(drug.generic_name)}
          </h1>
          {drug.atc_name && (
            <span
              style={{
                background: "var(--accent-soft)", color: "var(--accent-soft-text)",
                border: "1px solid var(--accent-border)",
                borderRadius: 999, fontSize: 12, padding: "3px 12px", fontWeight: 500,
              }}
            >
              {drug.atc_name}
            </span>
          )}
          {drug.is_controlled && (
            <span
              style={{
                display: "flex", alignItems: "center", gap: 4,
                background: "var(--major-bg)", color: "var(--major-text)",
                border: "1px solid #F0CFCB",
                borderRadius: 999, fontSize: 12, padding: "3px 12px", fontWeight: 600,
              }}
            >
              <Shield size={11} />
              Controlled substance
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
        {/* Drug details */}
        <Card>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 12 }}>Drug information</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {drug.brand_names && drug.brand_names.length > 0 && (
              <div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 500, marginBottom: 3 }}>Brand name(s)</div>
                <div style={{ fontSize: 13.5, color: "var(--text-primary)", fontFamily: "'IBM Plex Mono', monospace" }}>
                  {drug.brand_names.join(", ")}
                </div>
              </div>
            )}
            {drug.strength && (
              <div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 500, marginBottom: 3 }}>Strength</div>
                <div style={{ fontSize: 13.5, color: "var(--text-primary)" }}>{drug.strength}</div>
              </div>
            )}
            {drug.dosage_form && (
              <div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 500, marginBottom: 3 }}>Dosage form</div>
                <div style={{ fontSize: 13.5, color: "var(--text-primary)" }}>{capitalize(drug.dosage_form)}</div>
              </div>
            )}
            {drug.route && (
              <div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 500, marginBottom: 3 }}>Route</div>
                <div style={{ fontSize: 13.5, color: "var(--text-primary)" }}>{capitalize(drug.route)}</div>
              </div>
            )}
          </div>
        </Card>

        {/* Classification */}
        <Card>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 12 }}>Classification</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {drug.atc_code && (
              <div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 500, marginBottom: 3 }}>ATC code</div>
                <div style={{ fontSize: 13.5, color: "var(--text-primary)", fontFamily: "'IBM Plex Mono', monospace" }}>{drug.atc_code}</div>
              </div>
            )}
            {drug.atc_name && (
              <div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 500, marginBottom: 3 }}>ATC class</div>
                <div style={{ fontSize: 13.5, color: "var(--text-primary)" }}>{drug.atc_name}</div>
              </div>
            )}
            {drug.rxcui && (
              <div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 500, marginBottom: 3 }}>RxNorm CUI</div>
                <div style={{ fontSize: 13.5, color: "var(--text-primary)", fontFamily: "'IBM Plex Mono', monospace" }}>{drug.rxcui}</div>
              </div>
            )}
            {drug.representative_ndc && (
              <div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 500, marginBottom: 3 }}>NDC</div>
                <div style={{ fontSize: 13.5, color: "var(--text-primary)", fontFamily: "'IBM Plex Mono', monospace" }}>{drug.representative_ndc}</div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* DailyMed link */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18 }}>
        <span style={{ fontSize: 12.5, color: "var(--text-muted)", fontWeight: 500 }}>Source</span>
        <a
          href={dailyMedUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "flex", alignItems: "center", gap: 4,
            fontSize: 12.5, color: "var(--accent-soft-text)",
            background: "var(--accent-soft)", border: "1px solid var(--accent-border)",
            borderRadius: 999, padding: "4px 12px", textDecoration: "none", fontWeight: 500,
          }}
        >
          <ExternalLink size={11} />
          View on DailyMed
        </a>
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function SearchScreen() {
  const { state, set } = useApp();
  const supabase = createClient();

  const [query, setQuery]           = useState("");
  const [results, setResults]       = useState<DrugResult[]>([]);
  const [searching, setSearching]   = useState(false);
  const [dbDrug, setDbDrug]         = useState<DrugResult | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [noResults, setNoResults]   = useState(false);

  const drug = state.selectedDrug;
  const mono = drug ? monographs[drug] : null;

  // Debounced search — fires 300 ms after the user stops typing
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      setNoResults(false);
      return;
    }
    setNoResults(false);
    const timer = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase.rpc("search_drugs", { q: query.trim(), lim: 10 });
      const found = (data as DrugResult[]) || [];
      setResults(found);
      setShowDropdown(true);
      setNoResults(found.length === 0);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleSelect = (result: DrugResult) => {
    setShowDropdown(false);
    setQuery("");
    setResults([]);
    setNoResults(false);
    // If this drug has a monograph, show the rich view
    const monoKey = Object.keys(monographs).find(
      (k) => k.toLowerCase() === result.generic_name.toLowerCase()
    );
    if (monoKey) {
      set({ selectedDrug: monoKey });
    } else {
      setDbDrug(result);
    }
  };

  const handleBack = () => {
    set({ selectedDrug: null });
    setDbDrug(null);
    setQuery("");
    setResults([]);
    setShowDropdown(false);
    setNoResults(false);
  };

  // ── Monograph view ──────────────────────────────────────────────────────────
  if (drug && mono) {
    return (
      <div style={{ padding: "clamp(18px,3vw,26px) clamp(16px,3.5vw,32px)" }}>
        <MonographView drug={drug} mono={mono} onBack={handleBack} />
      </div>
    );
  }

  // ── DB drug basic card ──────────────────────────────────────────────────────
  if (dbDrug) {
    return (
      <div style={{ padding: "clamp(18px,3vw,26px) clamp(16px,3.5vw,32px)" }}>
        <DbDrugView drug={dbDrug} onBack={handleBack} />
      </div>
    );
  }

  // ── Search UI ───────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "clamp(18px,3vw,26px) clamp(16px,3.5vw,32px)" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 18, letterSpacing: "-0.01em" }}>Search</h1>

      {/* Search input + dropdown */}
      <div style={{ position: "relative", marginBottom: 24, maxWidth: 520 }}>
        {searching ? (
          <Loader
            size={16}
            strokeWidth={1.8}
            style={{
              position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)",
              color: "var(--accent)", animation: "spin 0.8s linear infinite",
            }}
          />
        ) : (
          <Search
            size={16}
            strokeWidth={1.8}
            style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
          />
        )}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          placeholder="Search any drug name…"
          style={{
            display: "block", width: "100%", height: 46,
            border: "1px solid var(--input-border)", borderRadius: 10,
            paddingLeft: 40, paddingRight: 14,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 14, outline: "none",
            background: "var(--card-bg)",
            boxSizing: "border-box",
          }}
        />

        {/* Results dropdown */}
        {showDropdown && results.length > 0 && (
          <div
            style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
              background: "var(--card-bg)", border: "1px solid var(--border)",
              borderRadius: 10, zIndex: 50,
              boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
              overflow: "hidden",
            }}
          >
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => handleSelect(r)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "10px 14px",
                  background: "none", border: "none", cursor: "pointer",
                  textAlign: "left", borderBottom: "1px solid var(--border-2)",
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-soft)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13.5, fontWeight: 600,
                      color: "var(--text-primary)",
                      fontFamily: "'IBM Plex Mono', monospace",
                      textTransform: "capitalize",
                    }}
                  >
                    {r.generic_name}
                  </div>
                  {r.brand_names && r.brand_names.length > 0 && (
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>
                      {r.brand_names.slice(0, 2).join(" · ")}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                  {r.atc_name && (
                    <span
                      style={{
                        fontSize: 11, color: "var(--accent-soft-text)",
                        background: "var(--accent-soft)", border: "1px solid var(--accent-border)",
                        borderRadius: 999, padding: "1px 8px", whiteSpace: "nowrap",
                        maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis",
                      }}
                    >
                      {r.atc_name}
                    </span>
                  )}
                  {MONOGRAPH_LOWER.has(r.generic_name.toLowerCase()) && (
                    <span
                      style={{
                        fontSize: 10.5, color: "var(--accent)",
                        fontWeight: 600, letterSpacing: "0.02em",
                      }}
                    >
                      Full monograph ↗
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No results hint */}
        {noResults && !searching && query.trim().length >= 2 && (
          <div
            style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
              background: "var(--card-bg)", border: "1px solid var(--border)",
              borderRadius: 10, padding: "14px 16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              fontSize: 13.5, color: "var(--text-muted)",
            }}
          >
            No drugs found for &ldquo;{query}&rdquo;
          </div>
        )}
      </div>

      {/* Spin keyframes — injected inline once */}
      <style>{`@keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }`}</style>

      {/* Monograph chips */}
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 12 }}>
        Browse drug monographs
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {DRUG_CHIPS.map((d) => (
          <button
            key={d}
            onClick={() => set({ selectedDrug: d })}
            style={{
              height: 36, padding: "0 16px",
              background: "var(--card-bg)", color: "var(--text-primary)",
              border: "1px solid var(--border)", borderRadius: 999,
              cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 13, fontWeight: 500,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--accent-soft)";
              e.currentTarget.style.borderColor = "var(--accent-border)";
              e.currentTarget.style.color = "var(--accent-soft-text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--card-bg)";
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}
