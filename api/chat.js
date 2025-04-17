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
          content: `Write a persuasive and well-formatted response for homeowners in the Bega Valley encouraging them to request professional solar panel cleaning services. Make the output visually appealing using headings, short paragraphs, and bullet points. Include the following:

- A short intro explaining the importance of solar panel cleanliness.
- A heading: "📉 Why Dirty Panels Cost You Money"
  - Explain how dirt, pollen, bird droppings, and grime reduce efficiency.
  - Mention that in the Bega Valley, a typical 5kW system generates around 6,600 kWh annually.
  - Point out that dirty panels can lose up to 15–20% efficiency (~1,000–1,300 kWh lost annually).
  - Estimate lost savings at $0.25/kWh — roughly $250–$325 per year.

- A heading: "💰 Long-Term Financial Benefits"
  - Highlight how cleaning can recover that lost energy and save ~$1,625 over 5 years.
  - Mention improved system lifespan and warranty protection.

- A heading: "📞 Book Your Cleaning Today"
  - Include this contact info at the bottom:
    - Phone: 0466545251
    - Email: s.r.lamont@proton.me
    "Format the entire response in clean HTML with headings (<h2>), paragraphs (<p>), and bullet points (<ul><li>) where appropriate."
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
