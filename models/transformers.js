/**
 * @file transformers.js
 * @description
 * Transformer-based classification and embedding tools using Xenova models.
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
 * 🚀 CATEGORY_OPTIONS (Available for UI & logic)
 */
export const CATEGORY_OPTIONS = [
  "📰 News & Media",
  "🛒 Shopping & E-Commerce",
  "💻 Technology & Development",
  "🎓 Education & Learning",
  "🎮 Gaming",
  "🎥 Entertainment & Streaming",
  "🏦 Finance & Banking",
  "💼 Business & Productivity",
  "⚕️ Health & Wellness",
  "🚀 Science & Research",
  "🏡 Real Estate & Housing",
  "🚗 Automotive",
  "✈️ Travel & Tourism",
  "🏋️ Sports & Fitness",
  "🏛️ Government & Politics",
  "🔒 Cybersecurity & Hacking",
  "📱 Social Media & Networking",
  "🚀 AI & Machine Learning",
  "🎨 Design & Creativity"
];

/**
 * 🧠 Load zero-shot classifier once
 */
export async function loadModel() {
  if (classifier) return classifier;
  if (loadingPipelinePromise) return loadingPipelinePromise;

  console.log("⏳ Loading Zero-Shot Classifier Model (Xenova)...");
  console.time("📦 Zero-Shot Model Load");

  loadingPipelinePromise = pipeline(
    "zero-shot-classification",
    "Xenova/distilbert-base-uncased-mnli",
    {
      progress_callback: (progress) => {
        console.log(progress);
      },
    }
  )
    .then((loadedPipeline) => {
      console.timeEnd("📦 Zero-Shot Model Load");
      console.log("✅ Zero-Shot Classifier Loaded Successfully!");
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
 * 🏷 Classify a page using zero-shot classification
 */
export async function classifyPage(textForClassification) {
  if (!classifier) {
    await loadModel();
  }

  const labels = {
    "News & Media": "Websites for news articles and updates (e.g., CNN, BBC, NYTimes, Reuters)",
    "Shopping & E-Commerce": "Online stores and marketplaces (e.g., Amazon, eBay, Walmart, BestBuy, Shein)",
    "Technology & Development": "Software development, coding, and tech news (e.g., GitHub, StackOverflow, TechCrunch, ProductHunt)",
    "Education & Learning": "Online courses, tutorials, and educational platforms (e.g., Coursera, Udemy, Pluralsight, Khan Academy)",
    "Gaming": "Video games, gaming platforms, and live streaming (e.g., Steam, Twitch, Xbox, PlayStation)",
    "Entertainment & Streaming": "Streaming services, movies, and music platforms (e.g., YouTube, Netflix, Hulu, Disney+)",
    "Finance & Banking": "Banking, investments, and cryptocurrency (e.g., Chase, PayPal, Robinhood, Stripe, Binance)",
    "Business & Productivity": "Tools for productivity and business management (e.g., Notion, Slack, Trello, Zoom, Salesforce)",
    "Health & Wellness": "Healthcare, fitness, and wellness resources (e.g., WebMD, Mayo Clinic, Healthline, Cleveland Clinic)",
    "Science & Research": "Scientific research and academic articles (e.g., NASA, ResearchGate, PubMed, Springer)",
    "Real Estate & Housing": "Property buying, selling, and renting (e.g., Zillow, Redfin, Realtor, Trulia)",
    "Automotive": "Car buying, reviews, and automotive news (e.g., Carvana, Edmunds, AutoTrader, Tesla, Ford)",
    "Travel & Tourism": "Travel booking, reviews, and guides (e.g., Expedia, Airbnb, TripAdvisor, Booking.com)",
    "Sports & Fitness": "Sports news, leagues, and fitness platforms (e.g., ESPN, Nike, Adidas, Strava, Bodybuilding.com)",
    "Government & Politics": "Government websites and political news (e.g., Whitehouse.gov, Congress.gov, UN, WHO)",
    "Cybersecurity & Hacking": "Cybersecurity tools and ethical hacking platforms (e.g., HackTheBox, TryHackMe, Kali Linux Docs)",
    "Social Media & Networking": "Social platforms for connecting and sharing (e.g., Facebook, Twitter, LinkedIn, Reddit, TikTok)",
    "AI & Machine Learning": "Artificial Intelligence and machine learning tools (e.g., OpenAI, HuggingFace, TensorFlow Docs)",
    "Design & Creativity": "Design tools and creative platforms (e.g., Dribbble, Figma, Behance, Canva)"
  };

  const descriptions = Object.values(labels);
  const categories = Object.keys(labels);

  try {
    const result = await classifier(textForClassification, descriptions, {
      hypothesis_template: "This website is primarily about {}."
    });
    return categories[result.labels.indexOf(result.labels[0])];
  } catch (error) {
    console.error("❌ Classification Error:", error);
    return "Uncategorized";
  }
}

