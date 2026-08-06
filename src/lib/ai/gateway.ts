import { GoogleGenAI } from "@google/genai";

// AI Gateway — the single point through which Taxus talks to an LLM
// provider, per SRS Volume 4, Chapter 3.5. Swapping providers means editing
// this file only; no calling code changes.
//
// Provider: Google Gemini (gemini-2.5-flash), chosen deliberately for MVP
// stage because Google AI Studio offers a genuine, ongoing free tier — no
// credit card, no expiring trial credits, roughly 1,500 requests/day. See
// README "AI provider & cost" for the important trade-off that comes with
// that: on the free tier, Google may use your prompts/responses to improve
// their products. For a tax practice handling real client financial data,
// switch to a paid Gemini tier (one line: add billing to the same API key
// in AI Studio) or back to another provider before going into real use —
// see the note at the bottom of this file for how.

let client: GoogleGenAI | null = null;

function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to your environment variables to enable the AI Tax Assistant and document extraction features (free at https://aistudio.google.com/apikey)."
    );
  }
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

const MODEL = "gemini-2.5-flash";

export const TAX_ASSISTANT_SYSTEM_PROMPT = `You are the Taxus Tax Assistant, an AI assistant embedded in a tax practice management platform used by Pakistani chartered accountants, tax consultants, and their clients.

Rules you must follow:
- Answer only using the context provided to you in this conversation (client/engagement data, uploaded document contents). Do not invent NTNs, figures, dates, or regulatory citations you were not given.
- If you are not confident in a factual or numeric claim, say so explicitly rather than guessing.
- You are not a substitute for a qualified tax professional's sign-off. Frame calculations and positions as drafts for review, not final filed positions.
- Keep responses concise, professional, and specific to the question asked.
- When asked about current Pakistani tax law specifics you don't have grounded context for, say you don't have that information rather than speculating on rates or provisions.`;

export interface AssistantChatParams {
  systemContext?: string;
  history: { role: "user" | "assistant"; content: string }[];
}

export async function getAssistantReply({ systemContext, history }: AssistantChatParams) {
  const ai = getClient();
  const systemInstruction = systemContext
    ? `${TAX_ASSISTANT_SYSTEM_PROMPT}\n\n---\nContext for this conversation:\n${systemContext}`
    : TAX_ASSISTANT_SYSTEM_PROMPT;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    config: { systemInstruction, maxOutputTokens: 1024 },
  });

  return response.text ?? "";
}

export interface ExtractedField {
  field: string;
  value: string;
  confidence: number;
}

// Document field extraction using Gemini's multimodal input, standing in for
// the dedicated OCR pipeline described in SRS Volume 4, Chapter 7. Works on
// images and PDFs supplied as base64.
export async function extractDocumentFields(params: {
  base64Data: string;
  mediaType: "image/png" | "image/jpeg" | "image/webp" | "application/pdf";
  documentCategory: string;
}): Promise<{ fields: ExtractedField[]; rawText: string }> {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { data: params.base64Data, mimeType: params.mediaType } },
          {
            text: `This document is categorized as "${params.documentCategory}". Extract the relevant structured fields (e.g. for a salary certificate: employer name, employer NTN, employee name, gross salary, tax deducted, tax year; for a bank statement: account title, account number, statement period, closing balance; adapt sensibly to what the document actually contains).`,
          },
        ],
      },
    ],
    config: {
      systemInstruction:
        "You extract structured field data from tax documents for a Pakistani accounting firm. Respond with ONLY a JSON object, no prose, no markdown fences: " +
        '{"fields": [{"field": string, "value": string, "confidence": number between 0 and 1}], "raw_text": string}. ' +
        "Confidence reflects how certain you are the extracted value is correct and complete, not just that text was present.",
      responseMimeType: "application/json",
    },
  });

  const raw = response.text ?? "{}";
  try {
    const cleaned = raw.trim().replace(/^```json\s*|```$/g, "");
    const parsed = JSON.parse(cleaned);
    return { fields: parsed.fields ?? [], rawText: parsed.raw_text ?? "" };
  } catch {
    return { fields: [], rawText: raw };
  }
}

// --- Switching providers later ---
// This file is the only place that talks to an LLM. To move to a paid
// Gemini tier: no code change, just add billing to the same API key in
// Google AI Studio. To move to a different provider entirely (e.g.
// Anthropic, OpenAI): replace the client + two calls above; every caller
// (src/app/api/assistant/route.ts, src/app/api/documents/extract/route.ts)
// only depends on getAssistantReply() and extractDocumentFields()'s
// signatures, not on anything Gemini-specific.
