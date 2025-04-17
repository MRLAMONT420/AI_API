export default async function handler(req, res) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const { prompt } = req.query;

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "API key is missing" });
  }

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // or try "gpt-3.5-turbo" for testing
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
      }),
    });

    const data = await response.json();

    console.log("OpenAI raw response:", JSON.stringify(data, null, 2));

    // Check and return content safely
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return res.status(500).json({ error: "No content in OpenAI response", fullResponse: data });
    }

    return res.status(200).json({ result: content });

  } catch (error) {
    console.error("Error with OpenAI request:", error);
    return res.status(500).json({ error: "Failed to fetch from OpenAI" });
  }
}
