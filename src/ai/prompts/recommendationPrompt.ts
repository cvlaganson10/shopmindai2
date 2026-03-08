// Product recommendation prompt — formatting for product search results

export const RECOMMENDATION_PROMPT = `Based on the retrieved product information in the context, recommend the best matching products for the shopper's request.

Format your response as:
1. A brief acknowledgment of what the shopper is looking for (1 sentence)
2. 1–3 product recommendations, each with:
   - Product name (bold or on its own line)
   - Price
   - Why it fits what they asked for (1–2 sentences)
3. A follow-up question to help narrow further, if helpful

Only recommend products that appear in the retrieved context.
Do not recommend products not mentioned in the context.
If no products match, say so clearly and ask a clarifying question.`;
