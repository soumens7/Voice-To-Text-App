"use client";
import { useState, useEffect, useRef } from "react";

const VoiceToText = () => {
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognitionRef.current = recognition;

        recognition.onerror = (event) => {
          console.error("Speech Recognition Error:", event.error);
          alert("Sorry, there was an error with speech recognition.");
        };
      } else {
        alert("Speech Recognition is not supported in this browser.");
      }
    }

    // Cleanup on component unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  let timeoutId;

  // Retry function to handle rate limiting
  const callAPIWithRetry = async (
    transcribedText,
    retries = 3,
    delay = 1000
  ) => {
    try {
      const response = await fetch("/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: transcribedText }),
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
      setResponse(data.result); // Set GPT-3 response
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

        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
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
        Voice-to-Text App
      </h1>

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
          {isLoading
            ? "Loading..."
            : response || "Translation or result will appear here"}
        </p>
      </div>
    </div>
  );
};

export default VoiceToText;
