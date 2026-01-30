import 'server-only';

interface VerificationInput {
  productName: string;
  productPrice: number;
  userCredits: number;
  invoiceText?: string;
}

export interface VerificationResult {
  isGreenProduct: boolean;
  reason: string;
  productCategory: string;
  confidence: 'high' | 'medium' | 'low';
  extractedDetails?: {
    detectedProductName?: string;
    detectedPrice?: number;
    sellerName?: string;
    invoiceDate?: string;
  };
}

const GREEN_CATEGORIES = [
  'solar panel',
  'solar water heater',
  'solar inverter',
  'solar battery',
  'electric vehicle',
  'ev',
  'e-bike',
  'electric scooter',
  'electric car',
  'electric motorcycle',
  'battery storage',
  'home battery',
  'powerwall',
  'wind turbine',
  'energy efficient appliance',
  '5-star',
  'led lights',
  'led bulb',
  'smart thermostat',
  'insulation',
  'heat pump',
  'rainwater harvesting',
  'composting system',
  'bicycle',
  'e-bicycle',
  'public transport pass',
  'metro card',
  'bus pass',
  'ev charger',
  'charging station',
];

function getOpenRouterConfig() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  return {
    apiKey,
    model: process.env.OPENROUTER_MODEL || 'gpt-4o-mini',
    appUrl: process.env.OPENROUTER_APP_URL || 'http://localhost:3000',
    appName: process.env.OPENROUTER_APP_NAME || 'GreenFin Investors PWA',
    timeoutMs: Number.parseInt(process.env.OPENROUTER_TIMEOUT_MS || '12000', 10),
  };
}

function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function fallbackVerification(productName: string): VerificationResult {
  const productLower = productName.toLowerCase();
  const matchedCategory = GREEN_CATEGORIES.find((cat) => productLower.includes(cat.toLowerCase()));

  if (matchedCategory) {
    return {
      isGreenProduct: true,
      reason: `Product matches green category: "${matchedCategory}"`,
      productCategory: capitalizeWords(matchedCategory),
      confidence: 'medium',
    };
  }

  const greenKeywords = ['solar', 'electric', 'ev', 'renewable', 'eco', 'green', 'sustainable'];
  const hasGreenKeyword = greenKeywords.some((kw) => productLower.includes(kw));

  if (hasGreenKeyword) {
    return {
      isGreenProduct: true,
      reason: 'Product name contains green/eco-friendly keywords',
      productCategory: 'Green Product',
      confidence: 'low',
    };
  }

  return {
    isGreenProduct: false,
    reason: 'Product does not match any green/renewable category',
    productCategory: 'Not Eligible',
    confidence: 'medium',
  };
}

function buildSystemPrompt(hasInvoice: boolean): string {
  const basePrompt = `You are a green product verification assistant for GreeFin. Users can redeem their Green Credits when purchasing green/eco-friendly products.

Your job is to decide if a claim is eligible.

ELIGIBLE:
- Solar: panels, water heaters, inverters, batteries, rooftop systems
- Electric Vehicles: cars, e-bikes, e-scooters, chargers
- Energy Storage: home batteries, storage systems
- Energy Efficient: 5-star rated appliances, LED systems
- Heating/Cooling: heat pumps, smart thermostats
- Water: rainwater harvesting
- Mobility: bicycles, public transport passes

NOT ELIGIBLE:
- Petrol/diesel vehicles
- Phones/laptops/TVs and general electronics
- Clothing, furniture, food
- Anything clearly unrelated to sustainability

Rules:
1) Product must be renewable/sustainable
2) If ambiguous, lean towards rejection
3) If price looks suspicious (e.g. solar panel for ₹500), flag it`;

  const invoiceInstructions = hasInvoice
    ? `

INVOICE (OCR text provided):
- Cross-check product name & amount against invoice text
- Extract seller name and invoice date if visible
- If invoice text is unclear, rely more on the stated product name`
    : `

NO INVOICE:
- Verify only using the product name + claimed price
- Be slightly more cautious without invoice proof`;

  return (
    basePrompt +
    invoiceInstructions +
    `

Respond ONLY in JSON:
{
  "isGreenProduct": boolean,
  "reason": "Clear explanation",
  "productCategory": "Category name or 'Not Eligible'",
  "confidence": "high" | "medium" | "low",
  "extractedDetails": {
    "detectedProductName": "string (if applicable)",
    "detectedPrice": number (if applicable),
    "sellerName": "string (if applicable)",
    "invoiceDate": "string (if applicable)"
  }
}`
  );
}

function buildUserPrompt(input: VerificationInput): string {
  const { productName, productPrice, userCredits, invoiceText } = input;

  let prompt = `Please verify this green credit redemption claim:

CLAIM DETAILS
- Product Name: ${productName}
- Claimed Price: ₹${productPrice.toLocaleString('en-IN')}
- User Credits Available: ₹${userCredits.toLocaleString('en-IN')}`;

  if (invoiceText && invoiceText.trim().length > 0) {
    const truncatedText = invoiceText.length > 2000 ? `${invoiceText.slice(0, 2000)}... [truncated]` : invoiceText;
    prompt += `

INVOICE TEXT (OCR)
\`\`\`
${truncatedText}
\`\`\``;
  } else {
    prompt += `

NOTE: No invoice uploaded.`;
  }

  prompt += `

Is this eligible? Respond with JSON only.`;
  return prompt;
}

export async function verifyGreenProduct(input: VerificationInput): Promise<VerificationResult> {
  const config = getOpenRouterConfig();

  if (!config) {
    return fallbackVerification(input.productName);
  }

  const systemPrompt = buildSystemPrompt(Boolean(input.invoiceText));
  const userPrompt = buildUserPrompt(input);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

    let response: Response;
    try {
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': config.appUrl,
          'X-Title': config.appName,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: config.model,
          temperature: 0,
          max_tokens: 500,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(`OpenRouter request failed: ${response.status}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const result = JSON.parse(jsonMatch[0]) as VerificationResult;
    const productLower = input.productName.toLowerCase();
    const hasGreenKeyword = GREEN_CATEGORIES.some((cat) => productLower.includes(cat.toLowerCase()));

    if (!result.isGreenProduct && hasGreenKeyword) {
      result.isGreenProduct = true;
      result.reason = `Product "${input.productName}" matches green category`;
      result.confidence = 'medium';
    }

    return result;
  } catch (error) {
    console.error('AI verification error:', error);
    return fallbackVerification(input.productName);
  }
}
