/**
 * OCR Service — uses Claude Vision to extract grocery items from bill images
 */

const extractBillItems = async (imageUrl) => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'url', url: imageUrl },
            },
            {
              type: 'text',
              text: `Extract all grocery items from this bill image.
Return ONLY a JSON object with this exact structure, no other text:
{
  "storeName": "store name or null",
  "billDate": "DD/MM/YYYY or null",
  "items": [
    {
      "name": "product name",
      "quantity": number_or_null,
      "unit": "kg/g/ml/l/pcs or null",
      "price": number_price_in_INR
    }
  ],
  "total": total_amount_or_null
}

Rules:
- Extract ONLY grocery/household items
- Price must be a number in INR (e.g., 45.5)
- Normalize units: convert 1000g to 1kg, 500ml stays as-is
- If you can't read a price clearly, set it to null
- Remove any items that are clearly fees, taxes, or discounts`,
            },
          ],
        }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content[0]?.text || '{}';

    // Parse the JSON response
    const cleaned = text.replace(/```json\n?|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      storeName: parsed.storeName || null,
      billDate: parsed.billDate || null,
      items: (parsed.items || []).filter(i => i.name && i.price),
      total: parsed.total || null,
    };
  } catch (err) {
    console.error('[OCR] Extraction failed:', err.message);
    return { storeName: null, items: [], total: null };
  }
};

module.exports = { extractBillItems };
