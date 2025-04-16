/**
 * @file transformers.js
 * @description
 * Transformer-based classification and embedding tools using FirefoxRecap custom model.
 */

import { pipeline, env } from "@xenova/transformers";

// ✅ Local caching setup
env.allowLocalModels = false;
env.useBrowserCache = true;

let classifier = null;
let embeddingModel = null;
let loadingPipelinePromise = null;
let loadingEmbeddingPromise = null;

/**
 * 🚀 CATEGORY_OPTIONS (Used across UI)
 */
export const CATEGORY_OPTIONS = [
  "📰 News & Media",
  "🛒 Shopping & E-Commerce",
  "💻 Technology & Development",
  "🎓 Education & Learning",
  "🎥 Entertainment & Streaming",
  "💼 Business & Productivity",
  "⚕️ Health & Wellness",
  "✈️ Travel & Tourism",
  "🏛️ Government & Politics",
  "📱 Social Media & Networking",
  "Uncategorized"
];

/**
 * 🧠 Load FirefoxRecap multi-label classification model
 */
export async function loadModel() {
  if (classifier) return classifier;
  if (loadingPipelinePromise) return loadingPipelinePromise;

  console.log("⏳ Loading FirefoxRecap Multi-label Classifier...");
  console.time("📦 Custom Model Load");

  loadingPipelinePromise = pipeline(
    "text-classification",
    "firefoxrecap/URL-TITLE-classifier",
    {
      progress_callback: (progress) => {
        console.log(progress);
      },
    }
  )
    .then((loadedPipeline) => {
      console.timeEnd("📦 Custom Model Load");
      console.log("✅ Custom Classifier Loaded Successfully!");
      classifier = loadedPipeline;
      return classifier;
    })
    .catch((err) => {
      console.error("❌ Model Loading Failed:", err);
      loadingPipelinePromise = null;
      throw err;
    });

  return loadingPipelinePromise;
}

/**
 * 📐 Load sentence embedding model once
 */
export async function loadEmbeddingModel() {
  if (embeddingModel) return embeddingModel;
  if (loadingEmbeddingPromise) return loadingEmbeddingPromise;

  console.log("⏳ Loading Sentence Embedding Model (Xenova)...");
  console.time("🧠 Embedding Model Load");

  loadingEmbeddingPromise = pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2")
    .then((model) => {
      console.timeEnd("🧠 Embedding Model Load");
      console.log("✅ Embedding Model Loaded Successfully!");
      embeddingModel = model;
      return model;
    })
    .catch((err) => {
      console.error("❌ Embedding Model Load Failed:", err);
      loadingEmbeddingPromise = null;
      throw err;
    });

  return loadingEmbeddingPromise;
}

/**
 * 🔍 Generate embedding for a given string
 */
export async function getEmbedding(text, useFake = false) {
  if (useFake) {
    return Array(384).fill(0.01); // Dummy vector for dev use
  }

  if (!embeddingModel) {
    await loadEmbeddingModel();
  }

  const result = await embeddingModel(text, {
    pooling: "mean",
    normalize: true,
  });
  return result.data;
}

/**
 * 🏷 Classify a page using FirefoxRecap multi-label classifier
 * Input format: `${url}:${title}`
 */
export async function classifyPage(textForClassification) {
  if (!classifier) await loadModel();

  try {
    const result = await classifier(textForClassification, { topk: 3 });

    const label = result[0]?.label || "Uncategorized";

    const labelMap = {
      News: "📰 News & Media",
      Entertainment: "🎥 Entertainment & Streaming",
      Shop: "🛒 Shopping & E-Commerce",
      Chat: "📱 Social Media & Networking",
      Education: "🎓 Education & Learning",
      Government: "🏛️ Government & Politics",
      Health: "⚕️ Health & Wellness",
      Technology: "💻 Technology & Development",
      Work: "💼 Business & Productivity",
      Travel: "✈️ Travel & Tourism",
      Uncategorized: "Uncategorized",
    };

    return labelMap[label] || "Uncategorized";
  } catch (error) {
    console.error("❌ Classification Error:", error);
    return "Uncategorized";
  }
}
