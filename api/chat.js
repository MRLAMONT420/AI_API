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
          { role: "system", content: "You are a helpful assistant providing sales and service information." },
          { role: "user", content: prompt || "Generate a compelling reason to request solar panel cleaning services including long-term savings benefits, 
            the contact details to be included at bottom should must be 0466545251 and email: s.r.lamont@proton.me, the response should be something like this, 
           In the Bega Valley, a typical 5kW solar panel system can generate around 6,500 to 7,000 kWh annually. However, dust and dirt can reduce efficiency by up to 20%. 
          Regular cleaning can restore up to 20% of your energy generation, saving approximately $300 per year based on average electricity rates of $0.25 per kWh.
          Case Example: After cleaning, the system can generate an additional 1,300 kWh annually, saving you $325 per year. Over 5 years, that's $1,625 in savings!
          Contact Us: Call us at 0466545251 or email us at solarcleaning.com.au to book your service!" },
        ],
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
