import { GoogleGenAI, Type, SchemaType } from "@google/genai";
import { GeneratedCaption, AnalysisResult } from "../types";

// Initialize the Gemini AI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates funny captions for an image using gemini-2.5-flash.
 * Uses JSON mode for structured output.
 */
export const generateMagicCaptions = async (base64Image: string): Promise<GeneratedCaption[]> => {
  const modelId = 'gemini-2.5-flash';

  const response = await ai.models.generateContent({
    model: modelId,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image
          }
        },
        {
          text: "Analyze this image and generate 5 funny, viral, and creative meme captions. Ensure they vary in style (e.g., sarcastic, relatable, punny)."
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: "The meme caption text" },
            category: { type: Type.STRING, description: "The style or mood of the caption" }
          },
          required: ["text"]
        }
      }
    }
  });

  const jsonText = response.text || "[]";
  try {
    return JSON.parse(jsonText) as GeneratedCaption[];
  } catch (e) {
    console.error("Failed to parse JSON response", e);
    return [];
  }
};

/**
 * Edits an image using text prompts with gemini-2.5-flash-image.
 * Returns the edited image as a base64 string.
 */
export const editMemeImage = async (base64Image: string, prompt: string): Promise<string | null> => {
  // Using gemini-2.5-flash-image (Nano Banana) for image editing/generation as requested
  const modelId = 'gemini-2.5-flash-image';

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: prompt
          }
        ]
      }
    });

    // The model returns the image in the response parts
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return part.inlineData.data;
      }
    }
    return null;
  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
};

/**
 * Analyzes an image deeply using gemini-3-pro-preview.
 */
export const analyzeImageContent = async (base64Image: string): Promise<AnalysisResult> => {
  // Using gemini-3-pro-preview for advanced reasoning/analysis as requested
  const modelId = 'gemini-3-pro-preview';

  const response = await ai.models.generateContent({
    model: modelId,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image
          }
        },
        {
          text: "Analyze this image in detail. Provide a catchy title, a detailed description of the scene and context, and a list of 5 relevant tags."
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["title", "description", "tags"]
      }
    }
  });

  const jsonText = response.text || "{}";
  try {
    return JSON.parse(jsonText) as AnalysisResult;
  } catch (e) {
    console.error("Failed to parse analysis JSON", e);
    return { title: "Error", description: "Could not parse analysis.", tags: [] };
  }
};
