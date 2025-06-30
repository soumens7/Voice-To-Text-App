# 🗣️ Voice-to-Text Translation App (English → Hindi)

This is a simple Voice-to-Text translation web application built with **Next.js** and **Tailwind CSS**, powered by **Hugging Face Inference API**. The app captures your speech, converts it to text using browser-based speech recognition, and translates it from English to Hindi (Devanagari script).

---

## 🔧 Features

- 🎤 **Voice Recognition** using browser APIs (works best in Chrome)
- 🌐 **Text Translation** from:
  - **English → Hindi**
  - **Roman Hindi → Hindi (Devanagari)**
- 📦 API integration with Hugging Face transformer models
- 🔁 Retry logic for Hugging Face API (handles rate limits)
- 🧠 Auto language detection
- 🎨 Clean and responsive UI with Tailwind CSS

---

## 🚀 Live Demo

> Check out the live version of the project [here](https://voice-to-text-app-shit.onrender.com/)

---

## ![alt text](<Screenshot 2025-06-30 at 11.20.57 PM.png>)

## 🛠️ Tech Stack

- **Frontend**: Next.js (React), Tailwind CSS
- **Speech Recognition**: Web Speech API
- **Translation API**: Hugging Face Inference API (Opus MT models)
- **Deployment**: Render (for both frontend and backend)

---

## 📁 Project Structure

/app
├── /api
│ └── /route
│ └── route.js # Server action using Hugging Face API
├── page.js # Main frontend logic
├── /components
│ └── VoiceToText.js # Voice-to-Text React component

## 🚀 Getting Started Locally

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/voice-to-text-app.git
cd voice-to-text-app
```

2. Install dependencies

npm install

3. Set up environment variables
   Create a .env.local file in the root directory and add your Hugging Face API key:

/env
HUGGINGFACE_API_KEY=your_api_key_here
🧠 You can get an API key from https://huggingface.co/settings/tokens

4. Run the development server

npm run dev
Visit http://localhost:3000 to view the app.

⚠️ Speech recognition works best in Google Chrome. Ensure microphone access is granted.

## 🙏 Acknowledgements

Hugging Face Transformers

Helsinki-NLP Opus MT
