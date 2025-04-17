export default async function handler(req, res) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing OpenAI API key." });
  }

  // Hardcode the initial prompt for the business card details
  const initialPrompt = `Write a persuasive and well-formatted "business card" to give to homeowners in the Bega Valley encouraging them to request professional solar panel cleaning services. Make the output visually appealing using headings, short paragraphs, and bullet points. Include the following:

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
  `;

  // Common questions and responses
  const commonQuestions = {
    "How much could I save with a 1kW solar system?": "For a 1kW system, cleaning can recover up to 15% of lost efficiency due to dirt, salt, and debris, which can save you about $50–$75 annually. By cleaning your panels, you avoid paying 30c/kWh for grid electricity and reduce reliance on costly energy. If you export energy, the feed-in tariff (6–9c/kWh) can help you earn additional income.",
    "What could I save with a 2kW solar system?": "With a 2kW system, cleaning could recover 15% of lost efficiency, saving you around $100–$150 per year. This saves on your electricity bill, which costs about 30c/kWh from the grid. If you export excess energy, you could also make money from the feed-in tariff (6–9c/kWh).",
    "What’s the savings potential for a 3kW system?": "For a 3kW system, cleaning could save you approximately $150–$200 annually by recovering lost efficiency of up to 15%. By reducing your reliance on expensive grid electricity (30c/kWh), you'll save more. If you export energy, you could also make money from the feed-in tariff (6–9c/kWh).",
    "How much could I save with a 4kW solar system?": "Cleaning your 4kW system can save you around $200–$250 annually by recovering up to 15% of lost efficiency. Reducing your dependence on grid electricity (30c/kWh) directly lowers your electricity bill. Additionally, the feed-in tariff can provide further savings if you export energy.",
    "What savings can I expect with a 5kW solar system?": "With a 5kW system, cleaning could save you $250–$325 annually by recovering up to 15–20% of the lost energy. By avoiding grid electricity charges (30c/kWh) and maximizing your system's output, you save significantly. If you export excess energy, you’ll earn a feed-in tariff of 6–9c/kWh, further boosting savings.",
    "What can I save with a 6kW solar system?": "A 6kW system can save you around $300–$375 annually through cleaning, which recovers 15–20% of lost energy. This helps reduce the need for grid electricity at 30c/kWh. By exporting energy, you may also earn from the feed-in tariff (6–9c/kWh). Regular cleaning ensures optimal performance of your system.",
    "How much can I save with a 7kW system?": "For a 7kW system, cleaning can save approximately $350–$450 annually by recovering 15–20% of lost efficiency. With grid electricity costing 30c/kWh, keeping your panels clean reduces your electricity bill. Additionally, if you export energy, the feed-in tariff can provide extra income.",
    "What’s the savings for an 8kW solar system after cleaning?": "Cleaning your 8kW system can save you $400–$500 annually by restoring up to 20% of lost efficiency. This helps reduce the amount of electricity you need to purchase from the grid at 30c/kWh. If you export excess energy, the feed-in tariff can help offset the cost of cleaning and bring in extra money.",
    "How much can I save with a 9kW system on the coast?": "For a 9kW system, cleaning can recover 20% of lost efficiency, which translates to savings of $450–$550 annually. This reduces the need to buy electricity from the grid at 30c/kWh, which can be quite expensive. Additionally, by exporting energy, you can earn a feed-in tariff of 6–9c/kWh.",
    "What savings can I expect with a 10kW solar system?": "A 10kW system can save you $500–$650 annually by recovering 20% of lost energy efficiency. This reduces the amount of grid electricity you need (at 30c/kWh), directly lowering your electricity costs. Additionally, exporting excess energy will earn you the feed-in tariff, adding to your savings.",
    "How much could I save with an 11kW solar system?": "With an 11kW system, cleaning could save you $550–$700 annually by recovering 20% of lost efficiency. Reducing reliance on grid electricity (30c/kWh) helps you save on energy bills. Additionally, the feed-in tariff can add to your savings if you export excess energy back to the grid.",
    "What could I save with a 12kW solar system?": "For a 12kW system, cleaning could save you $600–$750 annually by recovering up to 20% of lost energy. By avoiding grid electricity costs (30c/kWh) and maximizing the output of your panels, you’ll reduce your energy expenses. If you export excess energy, you can earn from the feed-in tariff (6–9c/kWh).",
    "How much can I save with a 13kW solar system?": "Cleaning your 13kW system can save you approximately $650–$800 annually by recovering 20% of lost energy efficiency. This will reduce your reliance on grid electricity (30c/kWh) and save you money on your energy bill. Exporting excess energy will also provide additional income from the feed-in tariff.",
    "What’s the savings potential for a 14kW solar system?": "A 14kW system can save you $700–$875 annually through cleaning, which restores up to 20% of the lost energy. By reducing your need for grid electricity (30c/kWh), you lower your electricity costs significantly. Additionally, the feed-in tariff (6–9c/kWh) can provide extra savings if you export energy.",
    "How much could I save with a 15kW solar system?": "For a 15kW system, cleaning could save you $750–$900 annually by recovering 20% of lost efficiency. This will lower your electricity bill by reducing your reliance on the grid (30c/kWh). Additionally, if you export excess energy, you could earn from the feed-in tariff (6–9c/kWh), increasing your overall savings."
  };

  const { prompt } = req.query; // Used for follow-up questions

  // If a prompt is passed (follow-up question), check if it's a common question
  const finalPrompt = commonQuestions[prompt] ? commonQuestions[prompt] : initialPrompt;

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
          { role: "user", content: finalPrompt }
        ]
      }),
    });

    const data = await response.json();

    if (data.error) {
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
