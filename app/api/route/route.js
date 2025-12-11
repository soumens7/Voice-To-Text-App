import axios from "axios";

/* ----------------- Configure model endpoints ----------------- */
const ROMAN_TO_DEV =
  "https://router.huggingface.co/hf-inference/models/ai4bharat/IndicTrans-v2-Roman-to-Devanagari";

const ENGLISH_TO_HINDI =
  "https://router.huggingface.co/hf-inference/models/Helsinki-NLP/opus-mt-en-hi";

const HINDI_TO_ENGLISH =
  "https://router.huggingface.co/hf-inference/models/Helsinki-NLP/opus-mt-hi-en";
/* ------------------------------------------------------------ */

const MAX_INPUT_LENGTH = 2000; // trim very long inputs

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

/** Transliterate Roman Hindi -> Devanagari using IndicTrans Roman model */
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

    // transliteration model returns generated_text
    return res.data?.[0]?.generated_text ?? "";
  } catch (err) {
    console.error("Transliteration failed:", err.response?.data || err.message);
    return "";
  }
}

/** Translate generic helper — returns best available string */
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

    // prefer translation_text, then generated_text, then string array
    const out =
      res.data?.[0]?.translation_text ??
      res.data?.[0]?.generated_text ??
      (Array.isArray(res.data) && typeof res.data[0] === "string"
        ? res.data[0]
        : undefined);

    return out ?? "";
  } catch (err) {
    console.error("Translation failed:", err.response?.data || err.message);
    throw err;
  }
}

export async function POST(req) {
  try {
    const { prompt: rawPrompt } = await req.json();
    if (!rawPrompt || !rawPrompt.trim()) {
      return new Response(JSON.stringify({ error: "No prompt provided" }), {
        status: 400,
      });
    }

    // trim extremely long inputs to keep inference stable
    const prompt = rawPrompt.slice(0, MAX_INPUT_LENGTH);

    let mode = "";
    let result = "";

    if (isDevanagari(prompt)) {
      // Hindi (Devanagari) -> English
      mode = "Hindi → English";
      result = await translate(prompt, HINDI_TO_ENGLISH);
    } else if (isLikelyRomanHindi(prompt)) {
      // Roman Hindi -> transliterate -> Hindi(Devanagari) -> English
      mode = "Roman Hindi → English (via transliteration)";
      const devanagari = await transliterateRomanToDevanagari(prompt);

      if (devanagari && devanagari.trim()) {
        result = await translate(devanagari, HINDI_TO_ENGLISH);

        // if translation empty, try direct transliteration result as fallback
        if (!result) {
          result = devanagari;
        }
      } else {
        // transliteration failed — best-effort fallback:
        // attempt to translate the original text as if it were English->Hindi (least ideal)
        console.warn(
          "Transliteration empty; attempting fallback translation of original text."
        );
        try {
          result = await translate(prompt, ENGLISH_TO_HINDI);
          mode += " (fallback: treated as English→Hindi)";
        } catch (fallbackErr) {
          // fallback failed — return a helpful error
          console.error(
            "Fallback translation also failed:",
            fallbackErr.response?.data || fallbackErr.message
          );
          return new Response(
            JSON.stringify({ error: "Translation/transliteration failed" }),
            { status: 500 }
          );
        }
      }
    } else {
      // Assume English -> Hindi
      mode = "English → Hindi";
      result = await translate(prompt, ENGLISH_TO_HINDI);
    }

    return new Response(JSON.stringify({ result, meta: { mode } }), {
      status: 200,
    });
  } catch (err) {
    console.error(
      "Translation route error:",
      err.response?.data || err.message || err
    );
    return new Response(
      JSON.stringify({
        error: "Translation failed",
        details: String(err.message || err),
      }),
      {
        status: 500,
      }
    );
  }
}
