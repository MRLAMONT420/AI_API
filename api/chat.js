export default async function handler(req, res) {
  const { prompt } = req.query;

  // Simulate delay for realism
  await new Promise(resolve => setTimeout(resolve, 500));

  // Return dummy result
  return res.status(200).json({
    result: `🔧 This is a test response for the prompt: "${prompt}"`
  });
}
