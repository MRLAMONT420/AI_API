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
  Australia. The business card should include the following points and should be structured with appropriate headings, each heading should be bold font:

Introduction:
Briefly introduce the importance of solar panel cleaning and how it helps maximize energy production, lower electricity bills, and extend the lifespan 
of solar systems.
Emphasize that regular cleaning can help maintain warranty protection and ensure long-term savings.
Impact of Dirty Panels:
Mention the average energy generation of a 5kW solar system in NSW (7,000-9,000 kWh/year).
Explain how dirty panels can reduce efficiency by 15-25%, leading to 1,000-1,750 kWh lost annually, which translates to a $250–$430 annual loss.
Feed-in Tariffs & Savings:
Detail the current feed-in tariffs in NSW (around 6–7 cents per kWh) and explain how clean panels can increase the energy output, leading to higher 
earnings from the grid.
Include potential extra feed-in earnings (around $60–$84/year) from cleaning.
Self-Consumption Savings:
Compare the cost of buying electricity from the grid (around $0.25–$0.30 per kWh) versus generating solar power with cleaned panels. 
Show how cleaning can save $250–$350 annually on power bills.
Cost of Cleaning:
Mention that the typical cost of a solar panel cleaning service is around $200 and explain why this is a wise investment considering 
the savings on electricity bills, feed-in tariffs, and warranty protection.
Call to Action:
Encourage homeowners and businesses to schedule cleaning services to protect their solar investment, improve performance, and lower long-term costs.
The tone should be professional, informative, and persuasive, making it clear that cleaning is a cost-effective way to maximize savings and ensure 
optimal solar performance."

  - A heading: "Book Your Cleaning Today"
    - Include this contact info at the bottom:
      - Phone: 0466545251
      - Email: s.r.lamont@proton.me`;
 
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
