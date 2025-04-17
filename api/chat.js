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
          content: `Write a persuasive paragraph for homeowners in the Bega Valley encouraging them to request solar panel cleaning services. Your tone should be friendly but informative. Include the following:

- Explain how dirt, pollen, and bird droppings reduce solar panel efficiency over time.
- Mention that in the Bega Valley, a standard 5kW system produces around 6,600 kWh per year.
- Note that dirty panels can lose up to 15–20% efficiency, potentially reducing generation by ~1,000–1,300 kWh annually.
- At an average electricity rate of $0.25 per kWh, that’s up to $325 in lost value each year.
- Emphasize the long-term savings — over 5 years, that’s around $1,625.
- Briefly suggest that regular cleaning also extends the lifespan of the system.
- End with a clear call to action including this contact information:
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
