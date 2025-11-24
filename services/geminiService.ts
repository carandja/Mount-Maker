import { GoogleGenAI, Type } from "@google/genai";
import { AIAdvice, MountConfig, Unit } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const getMountAdvice = async (
  description: string,
  currentConfig: MountConfig,
  unit: Unit
): Promise<AIAdvice> => {
  try {
    const ai = getClient();
    
    const prompt = `
      You are an expert art framer and gallery curator.
      A user needs advice on mounting a photograph.
      
      User's Description of Photo: "${description}"
      Current Photo Size: ${currentConfig.photoWidth} x ${currentConfig.photoHeight} ${unit}.
      Current Mode: ${currentConfig.mode}.
      
      Suggest optimal mount dimensions, specifically:
      1. A recommended photo border (inner white space).
      2. Recommended mount margins (top, bottom, sides). Note: Often a "weighted bottom" (slightly larger bottom margin) looks best for visual balance.
      3. A vertical offset if applicable.
      
      Provide a concise reasoning and a suggestion summary.
      Also provide the specific numeric values for the suggestion in the requested JSON format.
      Values should be in ${unit}.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestion: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            suggestedValues: {
              type: Type.OBJECT,
              properties: {
                photoBorder: { type: Type.NUMBER },
                mountOffset: { type: Type.NUMBER },
                topBorder: { type: Type.NUMBER },
                bottomBorder: { type: Type.NUMBER },
                sideBorder: { type: Type.NUMBER },
              }
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    
    if (!result.suggestedValues) {
        throw new Error("Invalid response from AI");
    }

    return {
      suggestion: result.suggestion,
      reasoning: result.reasoning,
      suggestedConfig: {
        photoBorder: result.suggestedValues.photoBorder,
        mountOffset: result.suggestedValues.mountOffset,
        // We map the suggested borders back to manualBorders for the app state
        manualBorders: {
            top: result.suggestedValues.topBorder,
            bottom: result.suggestedValues.bottomBorder,
            left: result.suggestedValues.sideBorder,
            right: result.suggestedValues.sideBorder
        },
        mode: 'CustomBorders' // AI usually suggests specific borders, so switch to custom
      }
    };

  } catch (error) {
    console.error("Error getting AI advice:", error);
    throw error;
  }
};
