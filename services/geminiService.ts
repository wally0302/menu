import { GoogleGenAI, Type } from "@google/genai";
import { MenuItem, Country } from "../types";


const getAI = (apiKey: string) => new GoogleGenAI({ apiKey });

export const parseMenuImage = async (base64Image: string, country: Country, apiKey: string): Promise<MenuItem[]> => {
  // API Key check handled by GoogleGenAI or env vars
  try {
    const ai = getAI(apiKey);

    let prompt = "";

    if (country === 'VN') {
      prompt = `
        You are an expert culinary translator for Vietnamese cuisine.
        Analyze the provided menu image.
        Extract the dishes into a structured JSON list.
        Currency is almost always VND.
        
        For each dish, extract:
        1. originalName: The Vietnamese name exactly as shown.
        2. translatedName: A concise Traditional Chinese (繁體中文) translation.
        3. englishName: A concise English translation.
        4. price: The numeric price value. If 'k' notation is used (e.g. 50k), convert to 50000.
        5. currency: Set to "VND".

        CRITICAL: Do NOT include any menu introduction, summary, or dish explanation. Only extract the dish names and prices.

        Return ONLY the JSON array.
      `;
    } else if (country === 'EN') {
      prompt = `
        You are an expert culinary translator.
        Analyze the provided menu image (English menu).
        Extract the dishes into a structured JSON list.
        Currency is likely USD (verify from context).
        
        For each dish, extract:
        1. originalName: The English name exactly as shown.
        2. translatedName: A concise Traditional Chinese (繁體中文) translation.
        3. englishName: The English name (cleaned up if necessary).
        4. price: The numeric price value.
        5. currency: Set to "USD".

        CRITICAL: Do NOT include any menu introduction, summary, or dish explanation. Only extract the dish names and prices.

        Return ONLY the JSON array.
      `;
    } else {
      // TW / Chinese
      prompt = `
        You are an expert culinary translator.
        Analyze the provided menu image (Traditional Chinese / Taiwan).
        Extract the dishes into a structured JSON list.
        Currency is TWD.
        
        For each dish, extract:
        1. originalName: The Chinese name exactly as shown.
        2. translatedName: Keep identical to originalName.
        3. englishName: A concise English translation.
        4. price: The numeric price value.
        5. currency: Set to "TWD".

        CRITICAL: Do NOT include any menu introduction, summary, or dish explanation. Only extract the dish names and prices.

        Return ONLY the JSON array.
      `;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "Generate a unique short ID like item_001" },
              originalName: { type: Type.STRING },
              translatedName: { type: Type.STRING },
              englishName: { type: Type.STRING },
              price: { type: Type.NUMBER },
              currency: { type: Type.STRING }
            },
            required: ["id", "originalName", "translatedName", "englishName", "price", "currency"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const data = JSON.parse(text) as MenuItem[];

    // Post-process to ensure unique IDs for multi-page support
    const timestamp = Date.now();
    return data.map((item, index) => ({
      ...item,
      id: `item_${timestamp}_${index}`
    }));

  } catch (error) {
    console.error("Gemini Vision Error:", error);
    throw error;
  }
};

export const explainDish = async (dishName: string, apiKey: string): Promise<string> => {
  if (!apiKey) return "API Key missing";
  try {
    const ai = getAI(apiKey);
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Explain the dish "${dishName}" to a foreign tourist in Traditional Chinese (繁體中文). Focus on taste, texture, and key ingredients. Keep it under 50 words.`,
    });
    return response.text || "無法取得說明";
  } catch (error) {
    return "暫時無法取得說明";
  }
}