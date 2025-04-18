import { supabase } from '../supabase.js';

export default async function handler(req, res) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing OpenAI API key." });
  }

  // === Fetch FAQs ===
  let faqs = [];
  let faqsError = null;

  try {
    const { data, error } = await supabase.from('FAQs').select('*');
    if (error) {
      console.error("❌ Supabase FAQs error:", error);
      faqsError = error;
    } else {
      faqs = data;
    }
  } catch (err) {
    console.error("🔥 Supabase FAQs exception:", err);
    faqsError = err;
  }

  // === Fetch Pricing ===
  let pricing = [];
  let pricingError = null;

  try {
    const { data, error } = await supabase.from('pricing').select('*');
    if (error) {
      console.error("❌ Supabase pricing error:", error);
      pricingError = error;
    } else {
      pricing = data;
    }
  } catch (err) {
    console.error("🔥 Supabase pricing exception:", err);
    pricingError = err;
  }

  if (faqsError || pricingError) {
    return res.status(500).json({ error: "Error fetching data from Supabase.", details: { faqsError, pricingError } });
  }

  // Format FAQs
  const faqsText = faqs.map(faq => `**Q: ${faq.question}**\nA: ${faq.answer}`).join('\n\n');

  // Format Pricing
 const pricingText = pricing.map(item =>
  `• **${item.name}** — $${item.base_price} ${item.unit_type}\n  _${item.description}_`
).join('\n');
  
  // === Your Hardcoded Prompt (stays as main focus) ===
  const initialPrompt = `Generate a professional and compelling digital business card for a solar panel cleaning service based in New South Wales (NSW), 
  Australia. The business card should include importants parts of the following points and should be structured with appropriate headings, each heading should be bold font:

The tone should be professional, informative, and persuasive, making it clear that cleaning is a cost-effective way to maximize savings and ensure 
optimal solar performance." 
Why Clean Your Solar Panels?
Briefly introduce the importance of solar panel cleaning and how it helps maximize energy production, lower electricity bills, and extend the lifespan 
of solar systems.
Emphasize that regular cleaning can help maintain warranty protection and ensure long-term savings, mention comstal climates and rural areas.
Maximizes energy production and lowers electricity bills.Extends system lifespan and preserves warranty coverage.Essential in coastal and rural areas where dust, salt and pollen accumulate.
Typical Energy Generation
Mention the average energy generation of a 5kW solar system in NSW (7,000-9,000 kWh/year).
Explain how dirty panels can reduce efficiency by 15-25%, leading to 1,000-1,750 kWh lost annually, which translates to a $250–$430 annual loss.
Annual energy lost: 7,500 kWh × 0.15 ≈ 1,125 kWh. Monetary impact (@ $0.33/kWh): 1,125 kWh × $0.33 ≈ $372 per year.
Feed-in Tariffs & Extra Earnings:
Detail the current feed-in tariffs in NSW (around 6–7 cents per kWh) and explain how clean panels can increase the energy output, leading to higher 
earnings from the grid. NSW feed‑in rates run from four point nine to seven point four cents per kWh (4.9–7.4 ¢/kWh). Extra annual income: 1,125 kWh × 0.049–0.074 $ ≈ $55–$83.
IPART benchmarks for 2025‑26: 4.9–7.4 c/kWh
Self-Consumption Savings:
Compare the cost of buying electricity from the grid Grid electricity costs about thirty‑two cents per kWh (32 ¢/kWh).
Recaptured energy savings: 1,125 kWh × $0.32 ≈ $360 per year.
Cleaning can boost output by up to twenty percent (20%)—that’s an extra 1,500 kWh or roughly $480 saved. (around $0.25–$0.30 per kWh) versus generating solar power with cleaned panels. 
Show how cleaning can save $250–$350 annually on power bills. it could increase earnings by up to 20% and also decrease amount purchased by up to 20%.
Cost of Cleaning:
Mention that panels are a long term investment ,typical cost of a solar panel cleaning service explain why this is a wise investment considering 
the savings on electricity bills, feed-in tariffs, and warranty protection, and optimal operation of your solar generator.
introduce potential benefits Typical surface clean: two hundred dollars ($200).
Total annual benefit ≈ $372 (self‑use) + $70 (mid‑FiT) ≈ $442.
Payback period: ($200 / $442) × 12 ≈ 5.4 months.
Call to Action:
Sometime add small encouragement to homeowners and businesses to schedule cleaning services to protect their solar investment, improve performance, and lower long-term costs.
A heading like: "Book Your Cleaning Today"'
 
  // Standard contact message to include in every response:
const contactDetails = `
If you have any questions or would like to schedule an appointment, feel free to get in touch:

📞 Phone: 0466545251  
📧 Email: s.r.lamont@proton.me  
Don't hesitate to reach out today and book your professional solar panel cleaning service!
`;

  // Query param overrides default prompt
  const { prompt } = req.query;
  const userPrompt = prompt || initialPrompt;

  // Build full context to include FAQs and pricing
// Build finalPrompt with markdown formatting instructions for OpenAI
const finalPrompt = `
You are a helpful assistant for a solar panel cleaning business in the Bega Valley. All responses should be **clearly structured** for easy reading, using markdown for formatting.

Please make sure to:
- Use **bold headings** for each section.
- Use **bullet points** for lists of benefits, features, or important points.
- Use **tables** where appropriate to present pricing information clearly.
- Include a **call to action** at the end of your response with contact information.

Here are some FAQs from past customers:
${faqsText}

Here is the current pricing list in markdown table format:
| **Service**            | **Price**  | **Description**                               |
|------------------------|------------|-----------------------------------------------|
${pricing.map(item => `| **${item.name}**  | $${item.base_price} | _${item.description}_ |`).join("\n")}

Now answer this request:
"${userPrompt}"

Please make sure to include the following contact information at the end of your response:
${contactDetails}
`;


  // === OpenAI Request ===
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
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(500).json({ error: "No content returned from OpenAI.", fullResponse: data });
    }

    return res.status(200).json({ result: content });

  } catch (err) {
    console.error("🔥 Server error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
