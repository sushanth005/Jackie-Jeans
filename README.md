# 👖 Jackie Jeans – Smart Fit Onboarding

This project was built for the **Humanity Founders Internship Hiring Challenge**.

The goal was to create a smooth and engaging onboarding experience that helps users complete the Jackie Jeans Fit Quiz before entering the main application. Instead of filling out a long form, users can either complete a simple step-by-step quiz or talk to an AI voice assistant that guides them through the same process.

The focus of this project was to make onboarding feel fast, intuitive, and mobile-friendly while collecting all of the information required for accurate jean size recommendations.

---

## Features

### Manual Onboarding

The manual flow presents the Fit Quiz one step at a time, making it easy to complete without feeling overwhelming.

Some highlights include:

* Mobile-first interface with clean, minimal design
* Progress indicator throughout the quiz
* Conditional questions for previously selected denim brands
* Optional weight question with an easy skip option
* Form validation and the ability to go back and edit answers
* Automatic redirect to the Jackie Jeans website after completion

---

### AI Voice Onboarding

The voice onboarding experience allows users to complete the entire quiz naturally through conversation.

The assistant:

* Speaks each question aloud
* Listens to the user's response
* Understands conversational answers
* Confirms important information before moving on
* Handles optional questions naturally
* Supports selecting multiple brands and collecting sizes for each one
* Allows users to interrupt while the assistant is speaking for a more natural conversation

The goal was to make the interaction feel more like talking to a personal stylist than filling out a form.

---

## Technologies Used

* Next.js 14 (App Router)
* TypeScript
* CSS Modules
* Web Speech API
* Groq (Llama 3) for voice transcript understanding

---

## Production Considerations

While building the project, I focused on making the experience reliable as well as visually polished.

Some improvements include:

* Graceful handling of speech recognition failures
* Timeout protection and fallback parsing for AI requests
* Error boundaries for unexpected runtime issues
* Responsive layouts optimized for mobile devices
* Clean TypeScript implementation with strict type checking

---

## Final Flow

Users can choose either onboarding experience:

1. Complete the manual Fit Quiz
2. Complete the AI voice conversation

Both flows collect the same information, generate a complete fit profile, and then seamlessly redirect users to the main Jackie Jeans website to continue their shopping experience.

---

Built as part of the **Jackie Jeans Smart Fit Onboarding Hackathon**.
