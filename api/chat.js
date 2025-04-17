export default async function handler(req, res) {
  try {
    const { prompt } = req.query;

    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const fakeResponse = `🔧 This is a test response for the prompt: "${prompt || "No prompt received"}"`;

    res.status(200).json({ result: fakeResponse });
  } catch (err) {
    console.error("🔥 Dummy API handler crashed:", err);
    res.status(500).json({ error: "Internal Server Error in dummy handler." });
  }
}
