export default async function handler(req, res) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const { prompt } = req.query;

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing OpenAI API key." });
  }

  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt." });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
  {
    role: "system",
    content: "You are a helpful assistant providing sales and service information."
  },
  {
    role: "user",
    content: `Generate a compelling sales pitch for solar panel cleaning services in the Bega Valley. Your response must include:

1. An opening that explains how dirty solar panels reduce efficiency.
2. A real-world stat about average solar generation for a 5kW system in Bega Valley (~6,500–7,000 kWh/year).
3. An example showing how cleaning can restore up to 20% efficiency and save around $300 per year at $0.25/kWh.
4. A 5-year savings estimate.
5. A strong closing call to action.

Important: You must include the exact contact details at the end of the message:
- Phone: 0466545251
- Email: s.r.lamont@proton.me`
  }
]
      }),
    });

    const data = await response.json();

    console.log("📦 OpenAI raw response:", JSON.stringify(data, null, 2));

    if (data.error) {
      // Log and return the error from OpenAI
      console.error("❌ OpenAI API Error:", data.error);
      return res.status(500).json({ error: data.error.message });
    }

    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      console.error("⚠️ Missing content in OpenAI response.");
      return res.status(500).json({ error: "No content returned from OpenAI.", fullResponse: data });
    }

    return res.status(200).json({ result: content });

  } catch (err) {
    console.error("🔥 Server error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
