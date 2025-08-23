import axios from "axios";

function isDevanagari(text) {
  return /[\u0900-\u097F]/.test(text);
}

function isLikelyRomanHindi(text) {
  const romanWords = ["mera", "kya", "tum", "kaise", "hai", "ho", "hun", "acha", "sab", "kyun"];
  const lower = text.toLowerCase();
  return romanWords.some((word) => lower.includes(word));
}

async function transliterateRomanToDevanagari(romanText) {
  const modelUrl = "https://api-inference.huggingface.co/models/ai4bharat/IndicTrans-v2-Roman-to-Devanagari";
  const input = `<hi> ${romanText}`;

  console.log(`📝 Transliterating: ${input}`);

  try {
    const response = await axios.post(
      modelUrl,
      { inputs: input, options: { wait_for_model: true } },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data?.[0]?.generated_text || "";
  } catch (error) {
    console.error("❌ Transliteration failed:", error.response?.data || error.message);
    return "";
  }
}

async function translate(text, modelUrl) {
  try {
    const response = await axios.post(
      modelUrl,
      { inputs: text, options: { wait_for_model: true } },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data?.[0]?.translation_text || "";
  } catch (error) {
    console.error("❌ Translation failed:", error.response?.data || error.message);
    throw error;
  }
}

export async function POST(req) {
  const { prompt } = await req.json();

  if (!prompt || !prompt.trim()) {
    return new Response(JSON.stringify({ error: "No prompt provided" }), {
      status: 400,
    });
  }

  const ENGLISH_TO_HINDI = "https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-en-hi";
  const HINDI_TO_ENGLISH = "https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-hi-en";

  try {
    let translatedText = "";
    let mode = "";

    console.log("🗣 Original prompt:", prompt);

    if (isDevanagari(prompt)) {
      mode = "Hindi (Devanagari) → English";
      translatedText = await translate(prompt, HINDI_TO_ENGLISH);
    } else if (isLikelyRomanHindi(prompt)) {
      mode = "Roman Hindi → English";
      const devanagari = await transliterateRomanToDevanagari(prompt);
      console.log("✅ Transliterated to:", devanagari);

      if (devanagari && devanagari.trim().length > 0) {
        translatedText = await translate(devanagari, HINDI_TO_ENGLISH);
      } else {
        mode += " (fallback to English → Hindi)";
        translatedText = await translate(prompt, ENGLISH_TO_HINDI);
      }
    } else {
      mode = "English → Hindi";
      translatedText = await translate(prompt, ENGLISH_TO_HINDI);
    }

    return new Response(JSON.stringify({ result: translatedText, meta: { mode } }), {
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Translation failed",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}
