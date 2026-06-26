const sampleRecord = {
  window: "past 30 days",
  uncertainEvents: 2,
  missedWeeklyDoses: 1,
  unconfirmedDoses: 2,
  fatigueTrend: "increased recently",
  nextReviewInDays: 18,
};

const systemPrompt = `
You are a product safety constrained assistant for CareLoop.
CareLoop is not an AI doctor.
You must not diagnose, recommend treatment, change dosage, or provide missed-dose medical advice.
Only summarize self-recorded adherence data into concise questions a patient can ask a licensed clinician.
Return JSON only with this shape:
{"questions":["..."],"disclaimer":"..."}
`;

function cleanJson(text) {
  const trimmed = String(text || "").trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model did not return JSON.");
  }
  return JSON.parse(trimmed.slice(start, end + 1));
}

async function callDeepSeek(record) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("Missing DEEPSEEK_API_KEY.");

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Create four doctor-visit questions from this sample record: ${JSON.stringify(record)}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek request failed: ${response.status}`);
  }

  const data = await response.json();
  return cleanJson(data.choices?.[0]?.message?.content);
}

async function callGemini(record) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY.");

  const model = process.env.GEMINI_MODEL || "gemini-1.5-pro";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${systemPrompt}\nCreate four doctor-visit questions from this sample record: ${JSON.stringify(record)}`,
              },
            ],
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini request failed: ${response.status}`);
  }

  const data = await response.json();
  return cleanJson(data.candidates?.[0]?.content?.parts?.[0]?.text);
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Use POST." });
    return;
  }

  try {
    const provider = (process.env.AI_PROVIDER || "deepseek").toLowerCase();
    const record = request.body?.record || sampleRecord;
    const result = provider === "gemini" ? await callGemini(record) : await callDeepSeek(record);

    response.status(200).json({
      provider,
      questions: result.questions || [],
      disclaimer:
        result.disclaimer ||
        "Generated from self-recorded data. This is not medical advice.",
    });
  } catch (error) {
    response.status(200).json({
      provider: process.env.AI_PROVIDER || "not-configured",
      fallback: true,
      error: error.message,
      questions: [
        "I had two uncertain medication events this month. How should I handle this in the future?",
        "I missed one weekly dose. Should I record it differently or contact the clinic next time?",
        "My fatigue score increased recently. Should any follow-up tests be considered?",
        "Should my next review date or lab test schedule be adjusted?",
      ],
      disclaimer:
        "Fallback demo output. Generated from sample self-recorded data. This is not medical advice.",
    });
  }
};
