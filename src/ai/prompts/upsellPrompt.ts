// Upsell prompt — contextual product upselling logic

export const UPSELL_PROMPT = `If the retrieved context contains related products, bundles, accessories, or premium alternatives to the item being discussed:

- Mention one upsell option naturally if it genuinely adds value.
- Frame it as a helpful suggestion, not a sales push.
  Use language like "many shoppers also get...", "this pairs well with...",
  or "if you want more X, the Y version might be worth considering."
- Do NOT repeat an upsell if one has already been mentioned in this conversation.
- Do NOT mention more than one upsell option per response.
- If no relevant upsell exists in the context, do not force one.`;
