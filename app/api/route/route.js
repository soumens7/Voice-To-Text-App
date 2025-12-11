import axios from "axios";

// Roman Hindi → Devanagari
const ROMAN_TO_DEV =
  "https://router.huggingface.co/hf-inference/models/ai4bharat/IndicTrans-v2-Roman-to-Devanagari";

// English → Hindi
const ENGLISH_TO_HINDI =
  "https://router.huggingface.co/hf-inference/models/Helsinki-NLP/opus-mt-en-hi";

// Hindi → English
const HINDI_TO_ENGLISH =
  "https://router.huggingface.co/hf-inference/models/Helsinki-NLP/opus-mt-hi-en";

const MAX_INPUT_LENGTH = 2000;

function isDevanagari(text) {
  return /[\u0900-\u097F]/.test(text);
}

function isLikelyRomanHindi(text) {
  const romanWords = [
    "mera",
    "kya",
    "tum",
    "kaise",
    "hai",
    "ho",
    "hun",
    "acha",
    "sab",
    "kyun",
  ];
  const lower = text.toLowerCase();
  return romanWords.some((w) => lower.includes(w));
}

/* ---------------- Transliteration ---------------- */
async function transliterateRomanToDevanagari(romanText) {
  try {
    const res = await axios.post(
      ROMAN_TO_DEV,
      { inputs: `<hi> ${romanText}`, options: { wait_for_model: true } },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.data?.[0]?.generated_text ?? "";
  } catch (err) {
    console.error("Transliteration failed:", err.response?.data || err.message);
    return "";
  }
}

/* ---------------- Translation Helper ---------------- */
async function translate(text, modelUrl) {
  try {
    const res = await axios.post(
      modelUrl,
      { inputs: text, options: { wait_for_model: true } },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const out =
      res.data?.[0]?.translation_text ??
      res.data?.[0]?.generated_text ??
      (Array.isArray(res.data) && typeof res.data[0] === "string"
        ? res.data[0]
        : "");

    return out;
  } catch (err) {
    console.error("Translation failed:", err.response?.data || err.message);
    throw err;
  }
}

/* ---------------------- ROUTE HANDLER ---------------------- */

export async function POST(req) {
  try {
    const { prompt: rawPrompt } = await req.json();
    if (!rawPrompt || !rawPrompt.trim()) {
      return new Response(JSON.stringify({ error: "No prompt provided" }), {
        status: 400,
      });
    }

    const prompt = rawPrompt.slice(0, MAX_INPUT_LENGTH);
    let result = "";
    let mode = "";

    console.log("🗣 Incoming prompt:", prompt);

    /* --- CASE 1: Hindi in Devanagari Script --- */
    if (isDevanagari(prompt)) {
      mode = "Hindi → English";
      result = await translate(prompt, HINDI_TO_ENGLISH);
    } else if (isLikelyRomanHindi(prompt)) {
      /* --- CASE 2: Roman Hindi --- */
      mode = "Roman Hindi → English";

      // Transliterate
      const devanagari = await transliterateRomanToDevanagari(prompt);
      console.log("Transliterated:", devanagari);

      if (devanagari && devanagari.trim()) {
        // Translate Hindi → English
        result = await translate(devanagari, HINDI_TO_ENGLISH);
      } else {
        // Transliteration failed → try direct HI→EN
        console.warn(
          "⚠️ Transliteration empty. Trying Hindi→English translation directly."
        );
        result = await translate(prompt, HINDI_TO_ENGLISH);
        mode += " (fallback)";
      }
    } else {
      /* --- CASE 3: Pure English --- */
      mode = "English → Hindi";
      result = await translate(prompt, ENGLISH_TO_HINDI);
    }

    return new Response(JSON.stringify({ result, meta: { mode } }), {
      status: 200,
    });
  } catch (err) {
    console.error("Translation Route Error:", err.message);
    return new Response(
      JSON.stringify({
        error: "Translation failed",
        details: err.message,
      }),
      { status: 500 }
    );
  }
}
