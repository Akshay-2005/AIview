import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { company, role, jdText, resumeText } = body;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      // Fallback opening question if no API key configured
      return NextResponse.json({
        openingQuestion: `Hello! I'm Alex, your PrepPilot AI interviewer. I'll be conducting your ${role} interview for ${company} today. We'll cover 5 questions across technical depth, behavioral situations, and your project experience. Let's start: Tell me about yourself and your most significant project. What problem did it solve and what was your specific role?`,
      });
    }

    const systemPrompt = buildSystemPrompt({ company, role, jdText, resumeText });

    const res = await callGroq(apiKey, [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Begin the interview with the first question." },
    ]);

    return NextResponse.json({ openingQuestion: res });
  } catch (err: unknown) {
    console.error("Interview start error:", err);
    return NextResponse.json(
      { message: "Failed to start interview. Check GROQ_API_KEY in .env.local" },
      { status: 500 }
    );
  }
}

function buildSystemPrompt({
  company,
  role,
  jdText,
  resumeText,
}: {
  company: string;
  role: string;
  jdText: string;
  resumeText: string;
}) {
  return `You are Alex, a senior technical interviewer conducting a real placement interview for the role of "${role}" at "${company}".

${jdText ? `JOB DESCRIPTION:\n${jdText}\n` : ""}
${resumeText ? `CANDIDATE RESUME:\n${resumeText}\n` : ""}

YOUR INTERVIEW STYLE:
- You are professional, direct, and realistic — not overly friendly
- You conduct a structured 5-question interview covering: (1) Self-intro & project, (2) Technical/DSA, (3) Resume deep-dive, (4) Behavioral STAR, (5) Role-specific scenario
- If the candidate mentions a technology (Redis, microservices, JWT, etc.), always probe deeper: "How exactly did you implement that?"
- If they use buzzwords without depth, challenge them: "Can you walk me through the actual implementation?"
- NEVER give away answers or be lenient. This is a real interview.
- Keep questions concise (2-3 sentences max)
- Start the interview now with Question 1: a warm but direct self-introduction + project question.

Respond ONLY with the interview question. No preamble.`;
}

async function callGroq(apiKey: string, messages: { role: string; content: string }[]) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: 300,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error: ${err}`);
  }

  const data = await res.json();
  return data.choices[0].message.content as string;
}
