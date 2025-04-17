export default async function handler(req, res) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const { prompt } = req.query;

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'API key is missing.' });
  }

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  try {
    // Request to OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
      }),
    });

    // Parse the response
    const data = await response.json();

    // Debugging log
    console.log("OpenAI response:", data);

    // Ensure the data structure is valid and accessible
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return res.status(200).json({ result: data.choices[0].message.content });
    } else {
      return res.status(500).json({ error: 'Invalid response from OpenAI API' });
    }
  } catch (error) {
    console.error("Error making request to OpenAI:", error);
    return res.status(500).json({ error: 'Something went wrong with the API request.' });
  }
}
