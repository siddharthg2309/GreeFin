import 'server-only';

import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

interface VerificationInput {
  productName: string;
  productPrice: number;
  userCredits: number;
}

export interface VerificationResult {
  isGreenProduct: boolean;
  reason: string;
  productCategory: string;
  estimatedPrice?: number;
}

const GREEN_CATEGORIES = [
  'solar panel',
  'solar water heater',
  'solar inverter',
  'electric vehicle',
  'ev',
  'e-bike',
  'electric scooter',
  'electric car',
  'battery storage',
  'home battery',
  'wind turbine',
  'energy efficient appliance',
  '5-star',
  'led lights',
  'smart thermostat',
  'insulation',
  'heat pump',
  'rainwater harvesting',
  'composting system',
  'bicycle',
  'e-bicycle',
  'public transport pass',
  'metro card',
];

let cachedLlm: ChatOpenAI | null | undefined;

function getLlm() {
  if (cachedLlm !== undefined) return cachedLlm;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    cachedLlm = null;
    return cachedLlm;
  }

  cachedLlm = new ChatOpenAI({
    modelName: 'anthropic/claude-3-haiku',
    openAIApiKey: apiKey,
    configuration: {
      baseURL: 'https://openrouter.ai/api/v1',
    },
    temperature: 0,
  });

  return cachedLlm;
}

function keywordFallback(productName: string): VerificationResult {
  const productLower = productName.toLowerCase();
  const isGreen = GREEN_CATEGORIES.some((cat) => productLower.includes(cat.toLowerCase()));
  return {
    isGreenProduct: isGreen,
    reason: isGreen
      ? 'Product matches green category keywords'
      : 'Product does not match any green category',
    productCategory: isGreen ? 'Green Product' : 'Not Eligible',
  };
}

export async function verifyGreenProduct(input: VerificationInput): Promise<VerificationResult> {
  const { productName, productPrice, userCredits } = input;
  const llm = getLlm();

  if (!llm) {
    return keywordFallback(productName);
  }

  const systemPrompt = `You are a green product verification assistant for GreenFin.
Your job is to determine if a product qualifies for green credit redemption.

ELIGIBLE PRODUCTS (renewable energy or eco-friendly):
- Solar panels, solar water heaters, solar inverters
- Electric vehicles (EVs), e-bikes, electric scooters
- Home batteries, energy storage systems
- Energy efficient appliances (5-star rated)
- LED lighting systems
- Heat pumps, smart thermostats
- Rainwater harvesting systems
- Bicycles, public transport passes

NOT ELIGIBLE:
- Regular vehicles (petrol/diesel)
- Standard home appliances
- Electronics (phones, laptops, TVs)
- Clothing, furniture, food
- Any non-environmental products

Respond in JSON format:
{
  "isGreenProduct": boolean,
  "reason": "Brief explanation",
  "productCategory": "Category name or 'Not Eligible'",
  "estimatedPrice": number (estimated market price in INR)
}`;

  const userPrompt = `Verify this product for green credit redemption:

Product Name: ${productName}
Claimed Price: ₹${productPrice}
User's Available Credits: ₹${userCredits}

Is this a valid green/renewable energy product? Respond with JSON only.`;

  try {
    const response = await llm.invoke([new SystemMessage(systemPrompt), new HumanMessage(userPrompt)]);

    const content = response.content as string;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const result = JSON.parse(jsonMatch[0]) as VerificationResult;
    const productLower = productName.toLowerCase();
    const hasGreenKeyword = GREEN_CATEGORIES.some((cat) => productLower.includes(cat.toLowerCase()));

    if (!result.isGreenProduct && hasGreenKeyword) {
      result.isGreenProduct = true;
      result.reason = `Product contains green keyword: ${productName}`;
    }

    return result;
  } catch (error) {
    console.error('AI verification error:', error);
    return keywordFallback(productName);
  }
}

