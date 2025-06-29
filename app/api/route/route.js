import axios from "axios";

// Utility to detect Hindi (Devanagari) characters
function detectLanguage(text) {
  const hindiRegex = /[\u0900-\u097F]/;
  return hindiRegex.test(text) ? "hi-en" : "en-hi";
}

// Retry logic for Hugging Face Inference API
const callAPIWithRetry = async (text, direction, retries = 3, delay = 1000) => {
  const modelUrl =
    direction === "hi-en"
      ? "https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-hi-en"
      : "https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-en-hi";

  try {
    const response = await axios.post(
      modelUrl,
      { inputs: text },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    if (retries > 0 && error.response?.status === 429) {
      console.log(`Rate limit hit. Retrying in ${delay}ms...`);
      await new Promise((res) => setTimeout(res, delay));
      return callAPIWithRetry(text, direction, retries - 1, delay * 2);
    } else {
      console.error(
        "Hugging Face API Error:",
        error?.response?.data || error.message
      );
      throw error;
    }
  }
};

export async function POST(req) {
  const { prompt } = await req.json();

  if (!prompt) {
    return new Response(JSON.stringify({ error: "No prompt provided" }), {
      status: 400,
    });
  }

  const direction = detectLanguage(prompt);

  try {
    const response = await callAPIWithRetry(prompt, direction);
    const translatedText =
      response[0]?.translation_text || "No output returned.";

    return new Response(JSON.stringify({ result: translatedText }), {
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Error with Hugging Face API",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}
