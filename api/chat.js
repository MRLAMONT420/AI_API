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
    const { data, error } = await supabase.from('FAQs').select('*');
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

  // Format FAQs into a markdown-style string for context
  const faqsText = faqs.map(faq => `**Q: ${faq.question}**\nA: ${faq.answer}`).join('\n\n');

  // Your original hardcoded initialPrompt
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

  // If user provided a prompt, use it — otherwise use the hardcoded one
  const { prompt } = req.query;
  const userPrompt = prompt || initialPrompt;

  // Combine with FAQ context
  const finalPrompt = `
You are a helpful assistant for a solar panel cleaning business in Bega Valley.

Below are some frequently asked questions (FAQs) for additional context. Use these to inform your response if relevant.

${faqsText}

Now respond to this request:
"${userPrompt}"
`;

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
