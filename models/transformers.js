
/**
 * @file transformers.js
 * @description
 * This module provides functionality for text classification and semantic similarity 
 * using pre-trained machine learning models from the Xenova Transformers library. 
 * It includes utilities for loading and caching models, generating embeddings, 
 * and performing zero-shot classification to categorize web page content into 
 * predefined categories.
 * 
 * Key Features:
 * - **Zero-Shot Classification**: Classifies text into a set of predefined categories 
 *   without requiring task-specific training.
 * - **Semantic Embedding Generation**: Generates dense vector representations of text 
 *   for tasks like similarity checks or clustering.
 * - **Model Caching**: Ensures efficient loading and reuse of models to optimize performance.
 * 
 * Usage:
 * - Import and call `classifyPage` to categorize text into one of the predefined categories.
 * - Use `getEmbedding` to generate a semantic embedding vector for a given text input.
 * - Models are loaded lazily and cached for reuse to minimize redundant operations.
 * 
 * Dependencies:
 * - `@xenova/transformers`: A library for running transformer-based models in JavaScript.
 * 
 * Example Categories:
 * - News & Media
 * - Technology & Development
 * - Entertainment & Streaming
 * - Shopping & E-Commerce
 * - And many more...
 * 
 * This module is designed to be used in browser environments with IndexedDB caching 
 * enabled for optimal performance.
 */
import { pipeline, env } from "@xenova/transformers";

// Allow local caching in IndexedDB and use browser cache
env.allowLocalModels = false;
env.useBrowserCache = true;

let classifier = null;
let embeddingModel = null;
let loadingPipelinePromise = null;

/**
 * 🚀 CATEGORY_OPTIONS (Now Available for background.js)
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
 * Load the Zero-Shot Classifier exactly once.
 */
export async function loadModel() {
    if (classifier) return classifier;
    if (loadingPipelinePromise) return loadingPipelinePromise;

    console.log("⏳ Loading Zero-Shot Classifier Model (Xenova)...");

    // Using a publicly accessible, smaller model that does not require an access token.
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
 * Loads the embedding model for semantic similarity checks.
 */
async function loadEmbeddingModel() {
    if (embeddingModel) return embeddingModel;

    console.log("⏳ Loading Sentence Embedding Model (Xenova)...");
    embeddingModel = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    console.log("✅ Embedding Model Loaded Successfully!");

    return embeddingModel;
}

/**
 * Generate an embedding vector for a given text (title + domain).
 */
export async function getEmbedding(text) {
    if (!embeddingModel) {
        await loadEmbeddingModel();
    }
    const result = await embeddingModel(text, {
        pooling: "mean",
        normalize: true
    });
    return result.data;
}

/**
 * Classify a page text using zero-shot classification with improved prompts.
 */
export async function classifyPage(textForClassification) {
    if (!classifier) {
        await loadModel();
    }

    // Expanded categories with improved examples
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










