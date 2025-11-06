const { GoogleGenAI } = require("@google/genai");
require('dotenv').config()
// Inisialisasi client dengan API key dari environment variable
const ai = new GoogleGenAI({
  apiKey: process.env.GEMMA,
});

async function generateContentWithMapsGrounding() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Lawson terdekat dari lokasi saya",
    config: {
      // Aktifkan grounding dengan Google Maps
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          // Lokasi: Los Angeles
          latLng: {
            latitude: -6.2309269,
            longitude: 106.5871438,
          },
        },
      },
    },
  });

  console.log("Generated Response:");
  console.log(response.text);

  
}

generateContentWithMapsGrounding().catch(console.error);
