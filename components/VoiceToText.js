"use client";
import { useState, useEffect, useRef } from "react";

const VoiceToText = () => {
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const recognitionRef = useRef(null);
  //const [direction, setDirection] = useState("auto"); // 'auto', 'hi-en', or 'en-hi'

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SR) {
      alert("Speech recognition not supported.");
      return;
    }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onerror = (event) => {
      console.error("Speech error:", event.error);
      alert(`Speech error: ${event.error}`);
    };

    recognition.onend = () => {
      console.log("Recognition ended");
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);
  const timeoutIdRef = useRef(null);

  // Retry function to handle rate limiting
  const callAPIWithRetry = async (
    transcribedText,
    retries = 3,
    delay = 1000
  ) => {
    try {
      const response = await fetch("/api/route/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: transcribedText, direction: "hi-en" }),
      });

      if (response.status === 429 && retries > 0) {
        console.log(`Rate limit hit. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay)); // Wait before retrying
        return callAPIWithRetry(transcribedText, retries - 1, delay * 2); // Exponential backoff
      }

      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }

      const data = await response.json();
      setResponse(data.result); // Save Hugging Face response
    } catch (error) {
      console.error("Error:", error);
      setResponse("Error occurred while fetching the translation.");
    }
  };

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      recognitionRef.current.onresult = (event) => {
        const result = event.results[event.resultIndex];
        const transcribedText = result[0].transcript;
        setTranscript(transcribedText);

        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
        }
        timeoutIdRef.current = setTimeout(() => {
          if (transcribedText.length > 1) {
            setIsLoading(true); // Show loading indicator

            // Use retry logic to send API request
            callAPIWithRetry(transcribedText)
              .then(() => setIsLoading(false)) // Hide loading after success
              .catch(() => setIsLoading(false)); // Hide loading on error
          }
        }, 1000); // Delay 1 second
      };
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <h1 className="text-4xl font-semibold text-blue-600 mb-6">
        Voice-to-Text Translation
      </h1>
      <h2 className="text-4xl font-semibold text-blue-600 mb-6">
        English → Hindi
      </h2>
      <div className="mb-4">
        {/* <label className="mr-2 font-medium text-gray-700">Translate:</label>
        <select
          value={direction}
          onChange={(e) => setDirection(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="auto">Auto Detec</option>
          <option value="hi-en">Hindi → English</option>
          <option value="en-hi">English → Hindi</option>
        </select> */}
      </div>
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-lg mb-4">
        <p className="text-lg font-medium text-gray-700 mb-4">
          {isListening ? "Listening..." : "Click to Start Listening"}
        </p>
        <p className="text-xl font-semibold text-gray-800">
          {transcript || "Speech will appear here"}
        </p>
      </div>

      <div className="mt-4">
        <button
          onClick={isListening ? stopListening : startListening}
          className="px-6 py-3 bg-blue-600 text-white rounded-full shadow-md transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {isListening ? "Stop Listening" : "Start Listening"}
        </button>
      </div>

      <div className="mt-6 w-full max-w-lg bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-medium text-gray-700 mb-4">
          API Response:
        </h2>
        <p className="text-lg text-gray-800">
          {isLoading ? "Loading..." : response || "Result will appear here"}
        </p>
      </div>
    </div>
  );
};

export default VoiceToText;
