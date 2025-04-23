import { OpenAI } from "openai";

export async function POST(req) {
  const { prompt } = await req.json();

  if (!prompt) {
    return new Response(JSON.stringify({ error: "No prompt provided" }), {
      status: 400,
    });
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY, // Your OpenAI API key
    });

    // Call the OpenAI API for chat completions
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // or any other model you want
      messages: [
        {
          role: "system",
          content: "You are a helpful translator.",
        },
        {
          role: "user",
          content: `Translate this Hindi text to English: ${prompt}`,
        },
      ],
    });

    // Access the content from the response structure
    const translatedText = response.choices[0].message.content.trim();

    // Return the result as JSON
    return new Response(JSON.stringify({ result: translatedText }), {
      status: 200,
    });
  } catch (error) {
    // Handle 429 error (quota exceeded)
    if (error.code === "insufficient_quota") {
      return new Response(
        JSON.stringify({ error: "Quota exceeded. Please check your plan." }),
        { status: 429 }
      );
    }

    console.error("OpenAI API Error:", error);
    return new Response(
      JSON.stringify({
        error: "Error with OpenAI API",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}
