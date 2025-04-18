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
  const initialPrompt = `Create a clear, professional digital business card for a solar panel cleaning service in Bega Valley New South Wales (NSW), Australia.
The card should:
- Use **bold headings** for sections
- Use **bullet points** for key benefits and stats
- Be informative and persuasive, focusing on cost savings and performance benefits

**Why Clean Solar Panels?**
- Boosts energy production, lowers power bills, and extends system lifespan
- Preserves warranty protection
- Especially valuable in coastal/rural areas (dust, salt, pollen)

**Energy Loss from Dirty Panels**
- A 5kW system in NSW generates 7,000–9,000 kWh/year
- Dirty panels reduce efficiency by 15–25% = 1,000–1,750 kWh lost annually
- At $0.33/kWh, that's a $250–$430 loss

**Feed-in Tariffs (FiT) & Earnings**
- NSW FiTs: 4.9–7.4¢/kWh
- Clean panels = higher output = $55–$83 more per year

**Self-Use Energy Savings**
- Grid power = $0.32/kWh
- Extra 1,125 kWh saved = $360/year
- Cleaning boosts output up to 20% (~$480 value)

**Cleaning Costs & ROI**
- Typical cleaning = $200
- Annual benefit = ~$442
- Payback in ~5.4 months

`; // <-- CLOSE this backtick!

const contactDetails = `

📞 Phone: 0466545251  
📧 Email: s.r.lamont@proton.me  
Don't hesitate to reach out today and book your professional solar panel cleaning service!
`;

// Query param overrides default prompt
const { prompt } = req.query;
const userPrompt = prompt || initialPrompt;

// === NEW: Keyword-based section triggers ===
const faqKeywords = ['faq', 'frequently asked questions', 'questions', 'help', 'assistance', 'inquiries'];
const pricingKeywords = ['pricing', 'price', 'prices', 'cost', 'rates', 'service price', 'pricing list', 'charges', 'fees', 'how much'];

const lowerPrompt = userPrompt.toLowerCase();

const includeFaqs = faqKeywords.some(keyword => lowerPrompt.includes(keyword));
const includePricing = pricingKeywords.some(keyword => lowerPrompt.includes(keyword));

// === Build final prompt ===
let finalPrompt = `
Now answer this request:
"${userPrompt}"

You are a helpful assistant for a solar panel cleaning business in the Bega Valley. All responses should be **clearly structured** for easy reading, using markdown for formatting.
`;

if (includeFaqs) {
  finalPrompt += `

Here are some FAQs from past customers:
${faqsText}
`;
}

if (includePricing) {
  finalPrompt += `

Here is the current pricing list in markdown table format:
| **Service**            | **Price**  | **Description**                               |
|------------------------|------------|-----------------------------------------------|
${pricing.map(item => `| **${item.name}**  | $${item.base_price} | _${item.description}_ |`).join("\n")}
`;
}

finalPrompt += `

Please make sure to include the following contact information at the end of your response:
${contactDetails}
`;

// === Log Final Prompt Length ===
console.log("🧪 Final prompt length:", finalPrompt.length);

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
        { role: "system", content: "Create a clear, professional digital business card for a solar panel cleaning service in Bega Valley New South Wales (NSW), Australia." },
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
