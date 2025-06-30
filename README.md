# 🗣️ Voice-to-Text Translation App (English → Hindi)

This is a simple Voice-to-Text translation web application built with **Next.js** and **Tailwind CSS**, powered by **Hugging Face Inference API**. The app captures your speech, converts it to text using browser-based speech recognition, and translates it from English (or Roman Hindi) to Hindi (Devanagari script).

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

## 🛠️ Tech Stack

- **Frontend**: Next.js (React), Tailwind CSS
- **Speech Recognition**: Web Speech API
- **Translation API**: Hugging Face Inference API (Opus MT and IndicTrans models)
- **Deployment**: Render (for both frontend and backend)

---

## 🚀 Getting Started Locally

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/voice-to-text-app.git
cd voice-to-text-app
```
