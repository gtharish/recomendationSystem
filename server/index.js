import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import { GoogleGenAI } from "@google/genai";
import { fileURLToPath } from "node:url";

dotenv.config({
  path: fileURLToPath(new URL("./.env", import.meta.url)),
});

const app = express();

const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_ORIGIN,
  })
);

app.use(express.json({ limit: "100kb" }));

// -------------------------
// Health Check
// -------------------------

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
  });
});

// -------------------------
// AI Recommendation
// -------------------------

app.post("/api/recommend", async (req, res) => {
  const { preference, products } = req.body;

  // Basic validation
  if (!preference || typeof preference !== "string") {
    return res.status(400).json({
      error: "Please enter your product preference.",
    });
  }

  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({
      error: "Product list is required.",
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: "Gemini API key is not configured.",
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    console.log("Sending request to Gemini...");

    console.time("Gemini request");

    const primaryModel = process.env.GEMINI_MODEL || "gemini-3.8-flash";
    const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash-lite";
    const generationRequest = {
      contents: `
User preference:
${preference}

Available products:
${JSON.stringify(products)}
      `,

      config: {
        systemInstruction: `
You are a product recommendation assistant.

Recommend products only from the provided product list.

Consider:
- User's requirements
- Budget
- Category
- Product features
- Product description

Never invent products.
Never change product IDs.

Return only the IDs of the best matching products.
If nothing matches, return an empty array.
        `,

        responseMimeType: "application/json",

        responseSchema: {
          type: "object",
          properties: {
            recommendedProductIds: {
              type: "array",
              items: {
                type: "integer",
              },
            },
          },
          required: ["recommendedProductIds"],
        },
      },
    };

    let result;
    try {
      result = await ai.models.generateContent({
        ...generationRequest,
        model: primaryModel,
      });
    } catch (modelError) {
      const modelUnavailable = modelError.status === 503
        || /unavailable|high demand|overloaded/i.test(modelError.message || "");

      if (!modelUnavailable || primaryModel === fallbackModel) {
        throw modelError;
      }

      console.warn(
        `Gemini model ${primaryModel} is unavailable; retrying with ${fallbackModel}.`
      );
      result = await ai.models.generateContent({
        ...generationRequest,
        model: fallbackModel,
      });
    }

    console.timeEnd("Gemini request");

    // -------------------------
    // Parse AI response
    // -------------------------

    const text = result.text;

    if (!text) {
      return res.status(502).json({
        error: "Gemini returned an empty response.",
      });
    }

    const recommendation = JSON.parse(text);

    const allowedIds = new Set(
      products.map((product) => product.id)
    );

    const recommendedProductIds =
      recommendation.recommendedProductIds;

    // Validate returned IDs
    if (!Array.isArray(recommendedProductIds)) {
      return res.status(502).json({
        error: "Invalid recommendation response.",
      });
    }

    const validIds = recommendedProductIds.filter((id) =>
      allowedIds.has(id)
    );

    // Remove duplicates
    const uniqueIds = [...new Set(validIds)];

    return res.json({
      recommendedProductIds: uniqueIds,
    });
  } catch (error) {
    console.error("Gemini error:", error.message);

    const message = error.message?.toLowerCase() || "";

    // API key error
    if (
      message.includes("api key") ||
      message.includes("unauthenticated") ||
      message.includes("invalid")
    ) {
      return res.status(401).json({
        error: "Invalid Gemini API key.",
      });
    }

    // Quota / rate limit
    if (
      message.includes("quota") ||
      message.includes("resource_exhausted") ||
      message.includes("rate limit") ||
      message.includes("429")
    ) {
      return res.status(429).json({
        error:
          "Gemini free quota or rate limit has been reached. Please try again later.",
      });
    }

    // Temporary model outage or high demand
    if (
      error.status === 503 ||
      message.includes("unavailable") ||
      message.includes("high demand") ||
      message.includes("overloaded")
    ) {
      return res.status(503).json({
        error:
          "Gemini is temporarily busy. Please try your recommendation again in a moment.",
      });
    }

    return res.status(500).json({
      error:
        "Something went wrong while getting AI recommendations.",
    });
  }
});

// -------------------------
// Start Server
// -------------------------

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
