import { GoogleGenAI, Type } from "@google/genai";
import { WeatherData, MandalaConfig } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface WeatherAnalysisResult {
  weather: WeatherData;
  mandala: MandalaConfig;
  sources: Array<{ title: string; uri: string }>;
}

export const analyzeWeatherAndGenerateMandala = async (lat: number, lng: number): Promise<WeatherAnalysisResult> => {
  try {
    // Step 1: Get Weather via Google Search Grounding
    // We use the Search tool to get real-time data.
    const weatherPrompt = `¿Cuál es el clima actual exacto en la latitud ${lat}, longitud ${lng}? Dame la temperatura (C), humedad (%), velocidad del viento (km/h), y una descripción breve de las condiciones (ej. Soleado, Lluvia). También dime el nombre de la ciudad o región.`;
    
    const searchResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: weatherPrompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const weatherDescription = searchResponse.text;
    
    // Extract sources if available
    const sources: Array<{ title: string; uri: string }> = [];
    const chunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk) => {
        if (chunk.web) {
          sources.push({ title: chunk.web.title || "Fuente Web", uri: chunk.web.uri || "#" });
        }
      });
    }

    // Step 2: Convert the text description into structured Mandala parameters + Structured Weather Data
    // We feed the previous search result into a new prompt with JSON schema enforcement.
    
    const schemaResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        Analiza el siguiente reporte del clima y genera dos objetos JSON: uno con los datos numéricos del clima y otro con la configuración artística para un mandala que represente ese clima.
        
        Reporte del Clima: "${weatherDescription}"

        Reglas para el Mandala:
        - Si hace calor (>25C), usa colores cálidos (rojos, naranjas). Si hace frío, azules/cyans.
        - Si hay mucho viento, rotationSpeed debe ser alto (max 10).
        - Si hay alta humedad, usa strokeWidth más grueso y formas más suaves (circle, petal).
        - Si es caótico (tormenta), usa 'triangle' y alta complexity.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            weatherData: {
              type: Type.OBJECT,
              properties: {
                temperature: { type: Type.NUMBER, description: "Temperature in Celsius" },
                humidity: { type: Type.NUMBER, description: "Humidity percentage 0-100" },
                windSpeed: { type: Type.NUMBER, description: "Wind speed in km/h" },
                condition: { type: Type.STRING, description: "Short condition e.g., Sunny" },
                locationName: { type: Type.STRING, description: "Detected city or region name" },
                description: { type: Type.STRING, description: "A poetic 1 sentence summary of the vibe" }
              },
              required: ["temperature", "humidity", "windSpeed", "condition", "locationName", "description"]
            },
            mandalaConfig: {
              type: Type.OBJECT,
              properties: {
                colors: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "Array of 5 hex color codes matching the weather mood"
                },
                shapeType: { 
                  type: Type.STRING, 
                  enum: ["circle", "triangle", "petal", "square"],
                  description: "The primary shape used in the mandala"
                },
                layerCount: { type: Type.NUMBER, description: "Integer 3-12" },
                rotationSpeed: { type: Type.NUMBER, description: "Float 0.0-10.0" },
                complexity: { type: Type.NUMBER, description: "Integer 1-10" },
                strokeWidth: { type: Type.NUMBER, description: "Float 0.5-5.0" }
              },
              required: ["colors", "shapeType", "layerCount", "rotationSpeed", "complexity", "strokeWidth"]
            }
          },
          required: ["weatherData", "mandalaConfig"]
        }
      }
    });

    const rawJson = schemaResponse.text;
    const parsedData = JSON.parse(rawJson);

    return {
      weather: parsedData.weatherData,
      mandala: parsedData.mandalaConfig,
      sources: sources
    };

  } catch (error) {
    console.error("Error in Gemini Service:", error);
    throw new Error("No pudimos analizar el clima en este momento.");
  }
};
