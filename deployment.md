# Deployment Guide (Vercel)

This project is built using Next.js and is fully optimized for deployment on the **Vercel** platform, which is the native hosting solution for Next.js applications. 

Follow these steps to deploy the Jackie Jeans Onboarding app:

## Prerequisites
1. **GitHub, GitLab, or Bitbucket Account**: Your code needs to be hosted in a remote git repository.
2. **Vercel Account**: Sign up for free at [vercel.com](https://vercel.com/signup).
3. **Groq API Key**: You need an API key for the conversational AI features. Get a free one at [console.groq.com](https://console.groq.com/).

## Step 1: Push Code to a Repository
If you haven't already, push this project to a remote Git repository (e.g., GitHub).

```bash
git init
git add .
git commit -m "Initial commit - Jackie Jeans Onboarding"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

*(Note: All `.md` files except this one and `README.md` are automatically ignored from Git to keep the repo clean).*

## Step 2: Import Project to Vercel
1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click the **Add New...** button and select **Project**.
3. Locate your Git repository in the list and click **Import**.

## Step 3: Configure Deployment Settings
In the configuration screen, Vercel will automatically detect that this is a **Next.js** project. Leave the *Build and Output Settings* as their defaults:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build` or `next build`
- **Output Directory**: `.next`

## Step 4: Add Environment Variables (Crucial)
Expand the **Environment Variables** section before you click deploy. The AI Voice flow **requires** the Groq API key to function.

Add the following variable:
- **Name**: `GROQ_API_KEY`
- **Value**: *(Paste your Groq API key here)*

Click **Add**.

## Step 5: Deploy
Click the **Deploy** button. Vercel will now:
1. Clone your repository.
2. Install dependencies (`npm install`).
3. Run the production build (`npm run build`).
4. Assign a secure `https` URL to your project.

This process typically takes less than 60 seconds.

## Troubleshooting

- **Voice chatbot gets stuck on "Processing...":** This means the Groq API key is missing or invalid. Check the Environment Variables section in your Vercel project settings, ensure `GROQ_API_KEY` is set correctly, and trigger a redeploy.
- **Microphone not working on mobile:** The Web Speech API requires the site to be hosted on `https`. Vercel provides this by default. Also, ensure you are testing in a supported browser (Chrome, Safari, or Edge) and that you have granted microphone permissions.
