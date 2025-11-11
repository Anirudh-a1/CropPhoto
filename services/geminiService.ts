
import { GoogleGenAI, Type } from "@google/genai";
import type { CropData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export async function getCropCoordinates(
  base64ImageData: string,
  mimeType: string
): Promise<CropData> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: `Analyze this image and provide square (1:1 aspect ratio) bounding box coordinates for a professional headshot of the main subject. 
            The crop should be tight on the head and shoulders, but ensure there is adequate headroom above the subject's head to avoid cutting it off.
            Return the coordinates as a JSON object with keys "x", "y", "width", and "height".
            These coordinates must be relative to the image's dimensions (values between 0.0 and 1.0).
            The width and height values must be identical to maintain a 1:1 aspect ratio.
            For example, a square crop in the top-left quadrant would be { "x": 0.0, "y": 0.0, "width": 0.5, "height": 0.5 }.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            x: { type: Type.NUMBER, description: "The top-left x-coordinate of the crop box (0.0 to 1.0)." },
            y: { type: Type.NUMBER, description: "The top-left y-coordinate of the crop box (0.0 to 1.0)." },
            width: { type: Type.NUMBER, description: "The width of the crop box (0.0 to 1.0)." },
            height: { type: Type.NUMBER, description: "The height of the crop box (0.0 to 1.0)." },
          },
          required: ["x", "y", "width", "height"],
        },
      },
    });

    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);
    
    // Basic validation
    if (typeof parsedJson.x !== 'number' || typeof parsedJson.y !== 'number' || typeof parsedJson.width !== 'number' || typeof parsedJson.height !== 'number') {
      throw new Error("Invalid data format from API");
    }

    return parsedJson as CropData;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Could not generate crop suggestions from the AI model.");
  }
}
