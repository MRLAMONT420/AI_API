import { supabase } from '../supabase.js';

export default async function handler(req, res) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing OpenAI API key." });
  }

  // Fetch data from Supabase
  let faqs = [];
  let supabaseError = null;

  try {
    const { data, error } = await supabase.from('faqs').select('*');
    if (error) {
      console.error("❌ Supabase fetch error:", error);
      supabaseError = error;
    } else {
      faqs = data;
      console.log("✅ Supabase FAQs fetched:", faqs);
    }
  } catch (err) {
    console.error("🔥 Supabase fetch exception:", err);
    supabaseError = err;
  }

  if (supabaseError) {
    return res.status(500).json({ error: "Error fetching FAQs from Supabase.", details: supabaseError });
  }

  // Hardcode the initial prompt in the backend
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
      - Email: s.r.lamont@proton.me`;

  // Predefined rules for common questions
  const commonQuestions = {
    "How much could I save with a 1kW solar system?": "For a 1kW system, cleaning can recover up to 15% of lost efficiency, which translates into saving around $50–$75 annually. This prevents you from having to pay 30c/kWh for grid electricity. If you export energy, you could earn from the feed-in tariff (6–9c/kWh).",
    "What could I save with a 2kW solar system?": "With a 2kW system, cleaning could save you about $100–$150 annually by recovering up to 15% of lost efficiency. This saves you from relying on grid electricity at 30c/kWh. Additionally, exporting excess energy can earn you money from the feed-in tariff.",
    "What’s the savings potential for a 3kW system?": "For a 3kW system, cleaning can save you $150–$200 annually by recovering up to 15% of lost efficiency. This helps reduce your need for grid electricity (30c/kWh). You can also earn income by exporting excess energy at a feed-in tariff of 6–9c/kWh.",
    "How much could I save with a 4kW solar system?": "Cleaning a 4kW system could save you $200–$250 annually by recovering 15% of lost efficiency. This reduces your reliance on expensive grid electricity (30c/kWh). If you export energy, you’ll earn from the feed-in tariff, increasing your savings.",
    "What savings can I expect with a 5kW solar system?": "For a 5kW system, cleaning can save you $250–$325 annually by recovering up to 15–20% of lost efficiency. By avoiding grid electricity at 30c/kWh and exporting energy, you can maximize savings through the feed-in tariff.",
    "How much can I save with a 6kW system?": "A 6kW system can save you $300–$375 annually by recovering up to 20% of lost efficiency. This lowers your electricity bill by reducing reliance on grid power (30c/kWh). Exporting excess energy also earns you from the feed-in tariff, contributing to long-term savings.",
    "What’s the savings for an 8kW solar system after cleaning?": "For an 8kW system, cleaning could save you $400–$500 annually by recovering up to 20% of lost efficiency. This reduces the need to purchase electricity from the grid at 30c/kWh. Additionally, exporting energy at a feed-in tariff can boost your overall savings.",
    "How much can I save with a 10kW solar system?": "With a 10kW system, cleaning could save you $500–$650 annually by recovering up to 20% of lost energy. This helps reduce your electricity bill by relying less on grid power (30c/kWh). Exporting excess energy will also earn you income from the feed-in tariff.",
    "How much could I save with an 11kW solar system?": "Cleaning your 11kW system could save you $550–$700 annually by recovering up to 20% of lost efficiency. This reduces your need for grid electricity at 30c/kWh. You can also earn from exporting energy with the feed-in tariff, adding to your savings.",
    "How much can I save with a 15kW solar system?": "For a 15kW system, cleaning could save you $750–$900 annually by recovering 20% of lost efficiency. This will lower your electricity bill by reducing your reliance on the grid at 30c/kWh. Exporting energy earns you from the feed-in tariff (6–9c/kWh)."
  };

  // Define dynamic responses based on the system size
  const getSavings = (systemSize) => {
    const lostEfficiency = systemSize * 0.15;
    const savingsFromEfficiency = lostEfficiency * 0.25;
    const gridCostSaved = systemSize * 0.3;

    return {
      totalSavings: savingsFromEfficiency + gridCostSaved,
      gridCostSaved,
      feedInTariffEarnings: systemSize * 0.06
    };
  };

  const { prompt } = req.query;

  // Construct final prompt
  const finalPrompt = prompt ? prompt : initialPrompt;

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

    if (!response.ok) {
      const text = await response.text();
      console.error("OpenAI API error response:", text);
      return res.status(response.status).json({ error: `API error: ${response.statusText}`, rawResponse: text });
    }

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
