import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// llama-3.3-70b-versatile: Groq free tier, far superior clinical reasoning vs 8b
const MODEL = "llama-3.3-70b-versatile";
const TIMEOUT_MS = 30_000;
const MAX_QUERY_CHARS = 1200;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── System prompts ────────────────────────────────────────────────────────────

const INTERACTION_SYSTEM = `You are a senior clinical pharmacist AI specialising in drug interaction analysis for hospital and community practice in Kuwait.

Your task: analyse EVERY drug combination in the user's query and return a structured JSON object.

INSTRUCTIONS — follow exactly:
1. Identify each drug mentioned. If a dose/form is given, note it.
2. For EVERY pair of drugs, determine whether a clinically meaningful interaction exists.
3. Choose the WORST-CASE overall severity across all pairs:
   - "None"     → no known interaction between any pair
   - "Minor"    → minimal clinical significance; routine monitoring is sufficient
   - "Moderate" → clinically significant; may require dose adjustment, schedule separation, or enhanced monitoring
   - "Major"    → potentially life-threatening or capable of causing permanent damage; combination is contraindicated or requires immediate clinical intervention
4. Write a clear, mechanism-based explanation (2–4 sentences). Name the exact pharmacological mechanism (e.g. CYP2C9 inhibition, additive QT prolongation, synergistic anticoagulation). Do NOT be vague.
5. Provide 3–5 actionable patient counselling points specific to THIS patient's context.
6. List the drug names that should be looked up in FDA DailyMed for source verification.
7. If the patient context includes allergies, diseases, age, sex, or pregnancy status, factor them into your assessment.

IMPORTANT: If NO interaction exists between any pair, severity must be "None" and explain that clearly. Never invent interactions.

Return ONLY valid JSON in this exact shape — no markdown, no text outside the JSON:
{
  "explanation": "<mechanism-based explanation of the interaction(s)>",
  "severity": "None" | "Minor" | "Moderate" | "Major",
  "counselling": ["<point 1>", "<point 2>", "<point 3>"],
  "fdaDrugs": ["<drug name 1>", "<drug name 2>"],
  "fdaDataFound": true
}`;

const QUESTION_SYSTEM = `You are a senior clinical pharmacist AI. Answer the pharmacist's clinical question accurately, concisely, and in a way that is immediately actionable in practice.

Return ONLY valid JSON in this exact shape — no markdown, no text outside the JSON:
{
  "explanation": "<clear, clinically accurate answer in 2–4 sentences>",
  "keyPoints": ["<key point 1>", "<key point 2>", "<key point 3>"],
  "fdaDrugs": ["<relevant drug name>"],
  "fdaDataFound": true
}`;

// ── FDA DailyMed link builder ─────────────────────────────────────────────────

function buildFdaSources(drugNames: string[]): { name: string; url: string }[] {
  return drugNames.slice(0, 4).map((name) => ({
    name,
    url: `https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=${encodeURIComponent(name)}&searchdb=cp`,
  }));
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const body = await req.json();
    const mode: "interaction" | "question" = body.mode ?? "interaction";
    const rawQuery: string = (body.query ?? "").trim().slice(0, MAX_QUERY_CHARS);
    const patientCtx = body.patientContext;

    if (!rawQuery) {
      return new Response(JSON.stringify({ error: "query is required" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Build user message — for interaction mode, include full patient context
    let userContent = rawQuery;
    if (mode === "interaction" && patientCtx) {
      const parts: string[] = [`Medications to check: ${rawQuery}`];
      if (patientCtx.age)      parts.push(`Patient age: ${patientCtx.age} years`);
      if (patientCtx.sex)      parts.push(`Sex: ${patientCtx.sex}`);
      if (patientCtx.preg && patientCtx.preg !== "Not pregnant") parts.push(`Pregnancy/lactation: ${patientCtx.preg}`);
      if (patientCtx.diseases?.length) parts.push(`Chronic conditions: ${patientCtx.diseases.join(", ")}`);
      if (patientCtx.allergies?.length) parts.push(`Known drug allergies: ${patientCtx.allergies.join(", ")}`);
      userContent = parts.join("\n");
    }

    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) throw new Error("API key not configured");

    // Call Groq
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const groqRes = await fetch(GROQ_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.1,          // low temp = more consistent clinical output
        max_tokens: 900,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: mode === "interaction" ? INTERACTION_SYSTEM : QUESTION_SYSTEM },
          { role: "user",   content: userContent },
        ],
      }),
    });

    clearTimeout(timer);

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      throw new Error(`Groq API error ${groqRes.status}: ${errText.slice(0, 200)}`);
    }

    const groqData = await groqRes.json();
    const rawJson = groqData.choices?.[0]?.message?.content ?? "{}";

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      throw new Error("Model returned malformed JSON");
    }

    // Build FDA source links from the drug names the model returned
    const fdaDrugs = Array.isArray(parsed.fdaDrugs) ? (parsed.fdaDrugs as string[]) : [];
    const fdaSources = buildFdaSources(fdaDrugs);

    // Shape the response the front-end expects
    const response =
      mode === "interaction"
        ? {
            explanation:  String(parsed.explanation  ?? ""),
            severity:     String(parsed.severity     ?? "None"),
            counselling:  Array.isArray(parsed.counselling) ? parsed.counselling : [],
            fdaSources,
            fdaDataFound: fdaSources.length > 0,
          }
        : {
            explanation:  String(parsed.explanation  ?? ""),
            keyPoints:    Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
            fdaSources,
            fdaDataFound: fdaSources.length > 0,
          };

    return new Response(JSON.stringify(response), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
