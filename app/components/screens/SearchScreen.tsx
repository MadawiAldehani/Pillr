"use client";
import { Search, ArrowLeft, ExternalLink } from "lucide-react";
import { Card } from "@/app/components/ui/Card";
import { useApp } from "@/app/store";

const DRUG_CHIPS = ["Warfarin", "Metformin", "Amoxicillin", "Tramadol", "Clarithromycin", "Ibuprofen"];

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

export function SearchScreen() {
  const { state, set } = useApp();
  const drug = state.selectedDrug;
  const mono = drug ? monographs[drug] : null;

  return (
    <div style={{ padding: "clamp(18px,3vw,26px) clamp(16px,3.5vw,32px)" }}>
      {drug && mono ? (
        <>
          <button
            onClick={() => set({ selectedDrug: null })}
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

          {/* Sources */}
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
      ) : (
        <>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 18, letterSpacing: "-0.01em" }}>Search</h1>
          <div style={{ position: "relative", marginBottom: 24, maxWidth: 520 }}>
            <Search
              size={16}
              strokeWidth={1.8}
              style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
            />
            <input
              placeholder="Search drug name…"
              style={{
                display: "block", width: "100%", height: 46,
                border: "1px solid var(--input-border)", borderRadius: 10,
                paddingLeft: 40, paddingRight: 14,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 14, outline: "none",
                background: "#fff",
              }}
              onKeyDown={(e) => {
                const val = (e.target as HTMLInputElement).value.trim();
                if (e.key === "Enter" && monographs[val]) {
                  set({ selectedDrug: val });
                }
              }}
            />
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 12 }}>Browse drug monographs</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {DRUG_CHIPS.map((drug) => (
              <button
                key={drug}
                onClick={() => set({ selectedDrug: drug })}
                style={{
                  height: 36, padding: "0 16px",
                  background: "#fff", color: "var(--text-primary)",
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
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }}
              >
                {drug}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
