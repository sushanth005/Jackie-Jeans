# 👖 Jackie Jeans — Smart Fit Onboarding

Welcome to the **Jackie Jeans Smart Fit Onboarding** project! This repository contains the solution for the Humanity Founders Internship Hiring Challenge. 

This project delivers a **premium, frictionless onboarding experience** designed to replace the guesswork of buying denim. It features two distinct, production-ready flows: a beautiful **Manual Quiz** and a state-of-the-art **AI Voice Assistant**.

---

## ✨ Features & Highlights

### 1. Manual Onboarding Flow (Mobile-First)
A sleek, tactile, glassmorphic UI that guides users through the 10-step Fit Quiz.
- **Premium Aesthetics:** Features fluid micro-interactions, responsive sizing, and a stunning "dark mode" luxury feel.
- **Dynamic State Management:** Conditional logic ensures the brand-sizes question (Q9) is dynamically generated based on the multi-select brand choices (Q8).
- **Effortless Skips:** Optional questions (like weight) feature clear, frictionless skip paths.

### 2. AI Voice Onboarding (Voice-to-Voice)
A true voice-driven conversational agent that listens, processes, and responds naturally.
- **Natural Language Parsing:** Powered by the Web Speech API and the **Groq LLM API**, Jackie understands casual speech (e.g., *"I'm about five foot six"* or *"Skip this one"*).
- **Resilient State Machine:** Built to handle real-world voice edge cases—including robust API timeouts, local parsing fallbacks, and instantaneous interrupt handling (if the user speaks while the AI is talking).
- **Immersive Feedback:** Features a custom, 60fps breathing microphone orb that pulses dynamically with the user's voice volume.

### 3. The Handoff
Both flows automatically serialize the collected fit data and perform a seamless redirect to the main Jackie Jeans website: 👉 `https://jackie-jeans.vercel.app/`

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Language:** TypeScript (Strict Mode)
- **Styling:** CSS Modules (Zero-runtime, highly performant, utilizing modern CSS variables and flex/grid layouts)
- **AI Processing:** [Groq](https://groq.com/) (Llama 3) for lightning-fast voice transcript parsing.
- **Voice Capabilities:** Native Web Speech API (SpeechRecognition + SpeechSynthesis)

---

## 🚀 Running Locally

To run this project on your local machine:

**1. Clone the repository**
```bash
git clone <your-repo-url>
cd jakie-jeans-onboarding
```

**2. Install dependencies**
```bash
npm install
```

**3. Set up Environment Variables**
Create a `.env.local` file in the root directory and add your Groq API key:
```env
GROQ_API_KEY=your_groq_api_key_here
```
*(You can get a free API key at [console.groq.com](https://console.groq.com/))*

**4. Start the development server**
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. (For the Voice Flow to work, ensure you are using Chrome or Edge, and grant microphone permissions).

---

## 🌍 Deployment Guide (Vercel)

This project is optimized for deployment on Vercel. Follow these steps to push it live:

1. Push your code to a GitHub, GitLab, or Bitbucket repository.
2. Log in to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your repository.
4. **Configure Environment Variables:**
   - In the "Environment Variables" section, add:
     - Name: `GROQ_API_KEY`
     - Value: `your_groq_api_key_here`
5. Leave the Build and Output Settings as default (`npm run build`).
6. Click **Deploy**.

Vercel will automatically build the project and provide you with a live URL within seconds!

---

## 🛡️ Production Readiness

This project was built not just to "work", but to survive production environments:
- **Global Error Boundaries:** Custom `error.tsx` catches runtime React crashes and displays a branded recovery screen instead of a white screen of death.
- **API Timeouts:** The Groq API route is wrapped in an `AbortController`. If the LLM hangs, the system falls back to strict local parsing instantly.
- **Zero Type Errors:** The project compiles cleanly (`npm run build`) with strict TypeScript configurations.
- **Dead Code Eliminated:** Optimized CSS payloads guarantee fast mobile load times.

---

*Designed and engineered for the Jackie Jeans Hackathon.* 🔥
