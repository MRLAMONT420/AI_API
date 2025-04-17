export default async function handler(req, res) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const { prompt } = req.query;

  // Check if the API key is missing
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'API key is missing.' });
  }

  // If no prompt is provided, return a default message
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  try {
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

    // Check if the response is OK
    if (!response.ok) {
      const errorMessage = await response.text();
      return res.status(response.status).json({ error: errorMessage });
    }

    // Parse the JSON response from OpenAI
    const data = await response.json();

    // Return the content of the first choice from OpenAI
    return res.status(200).json({ result: data.choices[0].message.content });
  } catch (error) {
    // Handle network or other errors
    console.error("Error making request to OpenAI:", error);
    return res.status(500).json({ error: 'Something went wrong with the API request.' });
  }
}