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


`; // <-- CLOSE this backtick!

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
