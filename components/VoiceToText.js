"use client";
import { useState, useEffect } from "react";

const VoiceToText = () => {
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        setSpeechRecognition(recognition);
      } else {
        alert("Speech Recognition is not supported in this browser.");
      }
    }
  }, []);

  const startListening = () => {
    if (speechRecognition) {
      speechRecognition.start();
      speechRecognition.onresult = (event) => {
        const result = event.results[event.resultIndex];
        const transcribedText = result[0].transcript;
        setTranscript(transcribedText);

        // Call GPT-3 API with the transcribed text
        fetch("/api/gpt3/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: transcribedText }),
        })
          .then((res) => res.json())
          .then((data) => {
            setResponse(data.result); // Set the GPT-3 response
          })
          .catch((error) => console.error("Error:", error));
      };
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (speechRecognition) {
      speechRecognition.stop();
      setIsListening(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <h1 className="text-4xl font-semibold text-blue-600 mb-6">
        Voice-to-Text App
      </h1>

      {/* Transcript Display */}
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-lg mb-4">
        <p className="text-lg font-medium text-gray-700 mb-4">
          {isListening ? "Listening..." : "Click to Start Listening"}
        </p>
        <p className="text-xl font-semibold text-gray-800">
          {transcript || "Speech will appear here"}
        </p>
      </div>

      {/* Start/Stop Button */}
      <div className="mt-4">
        <button
          onClick={isListening ? stopListening : startListening}
          className="px-6 py-3 bg-blue-600 text-white rounded-full shadow-md transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {isListening ? "Stop Listening" : "Start Listening"}
        </button>
      </div>

      {/* GPT-3 Response */}
      <div className="mt-6 w-full max-w-lg bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-medium text-gray-700 mb-4">
          GPT-3 Response:
        </h2>
        <p className="text-lg text-gray-800">
          {response || "Translation or result will appear here"}
        </p>
      </div>
    </div>
  );
};

export default VoiceToText;
