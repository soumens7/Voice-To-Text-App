import axios from "axios";

// Retry function to handle rate limiting and errors
const callAPIWithRetry = async (text, retries = 3, delay = 1000) => {
  try {
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-hi-en", // Hugging Face model URL
      {
        inputs: text, // the text you want to summarize or translate
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`, // Hugging Face API key
          "Content-Type": "application/json",
        },
      }
    );

    // Return the response
    return response.data;
  } catch (error) {
    if (retries > 0 && error.response && error.response.status === 429) {
      console.log(`Rate limit hit, retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay)); // Wait before retrying
      return callAPIWithRetry(text, retries - 1, delay * 2); // Exponential backoff
    } else {
      console.error("Error with Hugging Face API:", error);
      throw error; // Rethrow if no retries left or different error
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

  try {
    // Call the Hugging Face API with retry logic
    const response = await callAPIWithRetry(`Summarize this: ${prompt}`);

    // Get the summary text from the response
    const summaryText = response[0]?.summary_text || "No summary returned.";

    // Return the result as JSON
    return new Response(JSON.stringify({ result: summaryText }), {
      status: 200,
    });
  } catch (error) {
    console.error("Hugging Face API Error:", error);
    return new Response(
      JSON.stringify({
        error: "Error with Hugging Face API",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}

// Export for testing purposes
export { callAPIWithRetry };
