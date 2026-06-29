// src/app/api/groq-chat/route.ts
// Groq API route — used by voice page for AI answer parsing & response generation

import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { messages, systemPrompt } = await req.json();

    const chat = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: systemPrompt || 'You are Jackie, a friendly AI fit assistant for Jackie Jeans.' },
        ...messages,
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const content = chat.choices[0]?.message?.content ?? '';
    return NextResponse.json({ content });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
