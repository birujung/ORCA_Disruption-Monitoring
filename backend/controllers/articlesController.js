/**
 * Article Management and Analysis Module
 * 
 * This module provides a suite of functionalities to scrape, analyze, and manage articles 
 * related to disruptions. It integrates with third-party services (OpenAI, NewsAPI, 
 * Google Geocoding) and uses MongoDB as the database backend.
 * 
 * Dependencies:
 * - MongoDB for storing and querying articles.
 * - OpenAI for disruption type, severity, location detection, and article summarization.
 * - NewsAPI for fetching articles.
 * - Google Geocoding API for obtaining geographic coordinates.
 * - Natural.js for natural language processing.
 */

// Import required libraries and utilities
const { getDB } = require("../config/db.js");
const { ObjectId } = require("mongodb");
require("dotenv").config();
const OpenAI = require("openai");
const NewsAPI = require("newsapi");
const newsapi = new NewsAPI(process.env.NEWS_API_KEY);
const openai = new OpenAI(process.env.OPENAI_API_KEY);
const axios = require("axios");
const natural = require("natural");

// Constants (Can change later based on specific supplier for use case)
const CHINA_LAT = 35.8617;
const CHINA_LNG = 104.1954;

// List of predefined disruption categories (Can change later to be dynamic)
const categoriesList = [
  "Airport Disruption",
  "Bankruptcy",
  "Business Spin-Off",
  "Business Sale",
  "Chemical Spill",
  "Corruption",
  "Company Split",
  "Cyber Attack",
  "FDA/EMA/OSHA Action",
  "Factory Fire",
  "Geopolitical",
  "Leadership Transition",
  "Legal Action",
  "Merger & Acquisition",
  "Port Disruption",
  "Protest/Riot",
  "Supply Shortage",
  "Earthquake",
  "Extreme Weather",
  "Flood",
  "Hurricane",
  "Tornado",
  "Volcano",
  "Human Health",
  "Power Outage",
  "CNA"
];

// Utility Functions
/**
 * Calculate the distance between two geographic coordinates using the Haversine formula.
 * 
 * @param {number} lat1 Latitude of point 1
 * @param {number} lng1 Longitude of point 1
 * @param {number} lat2 Latitude of point 2
 * @param {number} lng2 Longitude of point 2
 * @returns {number} Distance between the two points in kilometers
 */
const calculateRadius = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

/**
 * Get geographic coordinates (latitude and longitude) for a location using Google Geocoding API.
 * 
 * @param {string} location Name of the location
 * @returns {Object} An object containing latitude (`lat`) and longitude (`lng`)
 */
const getLatLngFromLocation = async (location) => {
  if (!location || location === "Unknown") {
    return { lat: null, lng: null };
  }

  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        location
      )}&key=${process.env.GOOGLE_GEOCODING_API_KEY}`
    );

    const data = response.data;

    if (data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    } else {
      console.warn(`No results found for location: ${location}`);
      return { lat: null, lng: null };
    }
  } catch (error) {
    console.error(
      `Error fetching lat/lng for location "${location}":`,
      error.message
    );
    return { lat: null, lng: null };
  }
};

/**
 * Utility Function: Detect Country Fallback
 * 
 * This function attempts to manually detect the name of a country mentioned in a given text.
 * It searches for matches from a predefined list of country names.
 * 
 * - If a country is found, it returns the country name.
 * - If no match is found, it defaults to "United States of America."
 * 
 * @param {string} text The text to search for country names.
 * @returns {string} The detected country name or a default fallback country.
 */
const detectCountryFallback = (text) => {
  const countries = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", 
    "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", 
    "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", 
    "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", 
    "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", 
    "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Congo-Brazzaville)", 
    "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia (Czech Republic)", "Denmark", 
    "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", 
    "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini (fmr. Swaziland)", "Ethiopia", 
    "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", 
    "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", 
    "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", 
    "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", 
    "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", 
    "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", 
    "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia (Federated States of)", 
    "Moldova (Republic of)", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", 
    "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", 
    "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", 
    "Palau", "Palestine State", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", 
    "Poland", "Portugal", "Qatar", "Romania", "Russian Federation", "Rwanda", "Saint Kitts and Nevis", 
    "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", 
    "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", 
    "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", 
    "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Tajikistan", 
    "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", 
    "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", 
    "United Kingdom", "United States of America", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela", 
    "Vietnam", "Yemen", "Zambia", "Zimbabwe"
  ];
  
  const lowerText = text.toLowerCase();
  for (const country of countries) {
    const lowerCountry = country.toLowerCase();
    if (lowerText.includes(lowerCountry)) {
      console.log(`Detected country: ${country}`);
      return country;
    }
  }

  // Default country if none detected from the list (fallback option)
  return "United States of America";
};

/**
 * Extract text content from HTML.
 * 
 * @param {string} html HTML content
 * @returns {string} Plain text content
 */
const extractTextFromHTML = (html) => {
  const text = html
    .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "") // Remove scripts
    .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, "") // Remove styles
    .replace(/<\/?[a-z][\s\S]*?>/gi, "") // Remove HTML tags
    .replace(/\s+/g, " ") // Collapse whitespace
    .trim();
  return text;
};

// Functional API Endpoints
/**
 * Generate a keyword cloud from articles in the database.
 * 
 * - Analyzes the text content of articles to identify frequently used words.
 * - Uses Natural.js for tokenization and word frequency analysis.
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @returns {JSON} A list of keywords with their respective frequencies
 */
const getKeywordCloud = async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection(process.env.COLLECTION_NAME);

    // Ambil semua URL dari artikel
    const articles = await collection
      .find({ isdeleted: { $ne: true }, url: { $ne: null } })
      .toArray();

    if (articles.length === 0) {
      return res.status(404).json({ message: "No articles found." });
    }

    const tokenizer = new natural.WordTokenizer();
    const stopWords = [
      "the", "and", "is", "to", "a", "of", "in", "on", "at", "by", "for", "with",
      "as", "from", "this", "that", "it", "are", "was", "be", "or", "an", "but",
      "not", "if", "so", "we", "you", "he", "she", "they", "them", "then", "&nbsp;"
    ];

    const sanitizeText = (text) => {
      return text
        .replace(/&nbsp;/g, " ")      // Ganti &nbsp; dengan spasi
        .replace(/[^\w\s]/g, "")      // Hapus karakter non-alphanumeric kecuali spasi
        .replace(/\s+/g, " ")         // Hapus spasi berlebih
        .trim();
    };

    const wordFrequency = {};

    // Tokenisasi kata dari konten setiap artikel
    for (const article of articles) {
      try {
        const response = await axios.get(article.url);
        const htmlContent = response.data;

        // Bersihkan teks sebelum tokenisasi
        const textContent = sanitizeText(extractTextFromHTML(htmlContent));
        const words = tokenizer.tokenize(textContent.toLowerCase());

        words.forEach((word) => {
          if (!stopWords.includes(word) && word.length > 2) {
            wordFrequency[word] = (wordFrequency[word] || 0) + 1;
          }
        });
      } catch (error) {
        console.warn(`Error fetching content from URL ${article.url}: ${error.message}`);
      }
    }

    const keywords = Object.entries(wordFrequency)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count);

    res.status(200).json(keywords);
  } catch (error) {
    console.error("Error generating keyword cloud:", error.message);
    res.status(500).json({ message: "Error generating keyword cloud." });
  }
}; 

/**
 * Function to Check if an Article Exists in the Database
 * 
 * This function checks whether an article with a given URL already exists in the MongoDB collection.
 * 
 * @param {string} url The URL of the article to check.
 * @returns {boolean} `true` if the article exists, otherwise `false`.
 */
// (Still got duplicates from the same events. Can implement more checking.)
const checkArticleExists = async (url) => {
  const db = getDB();
  const collection = db.collection(process.env.COLLECTION_NAME);
  const article = await collection.findOne({ url });
  return !!article; // Return true jika artikel ditemukan
};

/**
 * Function to Detect Severity and Location Using OpenAI GPT
 * 
 * This function uses OpenAI GPT to determine:
 * 1. The severity level of a disruption (Low, Medium, High).
 * 2. The primary country affected by the disruption.
 * 
 * If OpenAI fails to detect a valid country, a manual fallback (`detectCountryFallback`) is used.
 * 
 * @param {string} text The article text to analyze.
 * @returns {Object} An object containing `severity` and `location`.
 */
const detectSeverityAndLocation = async (text) => {
  const prompt = `Given the following information about an article "${text}":
                  
                  Based on this information, please:
                  1. Determine the severity level of the disruption mentioned, selecting from: "Low," "Medium," or "High." 
                     - Consider the overall tone and language used to assess impact level.
                  2. Identify the primary country affected by the disruption. 
                     - If multiple countries are mentioned, select the one that is most frequently referenced. 
                     - If no clear country is specified, try to infer the location from contextual clues, but never respond with "Unknown" as the location.
                  Format the response EXACTLY as: "Severity: <Low/Medium/High>, Location: <Country Name>". No further explanation needed.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an assistant that categorizes disruption severity and always provides a primary affected country based on the context, even if inferred.",
      },
      { role: "user", content: prompt },
    ],
    max_tokens: 50,
  });

  const response =
    completion.choices[0]?.message?.content?.trim() ||
    "Severity: Low, Location: No Location Detected";

  const [severity, location] = response
    .split(",")
    .map((part) => part.split(":")[1].trim());

  // Fallback to detect country manually if AI fails to detect a valid country
  const finalLocation = location === "No Location Detected" || location === "Unknown" 
    ? detectCountryFallback(text) 
    : location;

  return { severity, location: finalLocation };
};

/**
 * Function to Detect Disruption Type Using OpenAI GPT
 * 
 * This function classifies the type of disruption described in a given article 
 * into one of the predefined categories using OpenAI GPT.
 * 
 * - It prompts GPT with the article content and a list of possible categories.
 * - The response is a single category that best describes the disruption.
 * 
 * @param {string} text The content of the article to classify.
 * @returns {string} The detected disruption type or "Unknown" if classification fails.
 */
const detectDisruptionType = async (text) => {
  const formattedCategories = categoriesList.map(cat => `'${cat}'`).join(", "); // Format kategori

  const prompt = `Based on the following information about an article: "${text}"
                  
                  Classify the disruption described in this article into one of these categories:
                  ${formattedCategories}

                  Select only one category from the list above that best fits the type of disruption. Do not provide any additional text or explanation, just respond with the single category name.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an assistant that categorizes disruptions based on the context, even if inferred." },
        { role: "user", content: prompt },
      ],
      max_tokens: 10,
    });

    return completion.choices[0]?.message?.content?.trim() || "Unknown";
  } catch (error) {
    console.error("Error in detectDisruptionType:", error.message);
    return "Unknown"; // Default value jika API gagal
  }
};

/**
 * Function to Summarize an Article Using OpenAI GPT
 * 
 * This function generates a concise summary of a given article using OpenAI GPT.
 * 
 * - The summary includes no more than four sentences focusing on the main points, events, or conclusions.
 * - If the summarization fails, the original text is returned as a fallback.
 * 
 * @param {string} text The content of the article to summarize.
 * @returns {string} A summary of the article or the original text if summarization fails.
 */
const summarizeArticle = async (text) => {
  const prompt = `Summarize the following article into a concise overview of no more than four sentences. Focus on the main points, events, or conclusions described: "${text}"`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an assistant that provides brief and informative summaries of articles." },
        { role: "user", content: prompt },
      ],
      max_tokens: 100,
    });

    return completion.choices[0]?.message?.content?.trim() || text;
  } catch (error) {
    console.error("Error summarizing article:", error.message);
    return text;
  }
};

/**
 * Function to Save Articles to the Database (Batch Insertion)
 * 
 * This function saves or updates multiple articles in the MongoDB database.
 * 
 * - It checks if an article already exists and skips it if it is marked as deleted.
 * - If the article does not exist, it is inserted into the database.
 * - If the article exists and is not deleted, it is updated with the new data.
 * 
 * @param {Array<Object>} articles An array of articles to save or update in the database.
 * @returns {void}
 */
const saveArticlesToDatabase = async (articles) => {
  try {
    const db = getDB();
    const collection = db.collection(process.env.COLLECTION_NAME);

    for (const article of articles) {
      // Cek apakah artikel sudah dihapus sebelumnya
      const existingArticle = await collection.findOne({ url: article.url });
      if (existingArticle && existingArticle.isdeleted) {
        console.log(`Skipping deleted article: ${article.url}`);
        continue; // Lewati artikel yang sudah ditandai isdeleted
      }

      // Simpan atau update artikel jika tidak dihapus
      await collection.updateOne(
        { url: article.url },
        { $set: article },
        { upsert: true }
      );
    }

    console.log(`${articles.length} articles processed successfully.`);
  } catch (error) {
    console.error("Error saving articles to MongoDB:", error.message);
  }
};

/**
 * Scrape and save articles from NewsAPI to the database.
 * 
 * - Fetches articles using NewsAPI for a given date range.
 * - Analyzes and processes each article to detect disruption type, severity, and location.
 * - Saves the processed articles to MongoDB.
 */
const scrapeAndSaveArticles = async (req, res) => {
  try {
    const { from, to } = req.query;

    const fromDate = from || new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().slice(0, 10);
    const toDate = to || new Date().toISOString().slice(0, 10);

    if (new Date(fromDate) > new Date(toDate)) {
      return res.status(400).json({ message: "Invalid date range. 'from' must be earlier than 'to'." });
    }

    console.log(`Scraping articles from ${fromDate} to ${toDate}`);

    const response = await newsapi.v2.everything({
      q: "'supply chain disruption' OR 'global disruption'",
      from: fromDate,
      to: toDate,
      language: "en",
      sortBy: "publishedAt",
      pageSize: 20,
    });

    if (response.status === "ok" && response.articles.length > 0) {
      const articlesToSave = [];

      for (const article of response.articles) {
        const articleExists = await checkArticleExists(article.url);
        if (articleExists) continue; // Skip jika sudah ada

        const text = article.content || article.description || article.title || "No Content Available";
        const disruptionType = await detectDisruptionType(text);

        if (disruptionType === "Unknown") continue;

        // Deteksi lokasi dan severity
        const { severity, location } = await detectSeverityAndLocation(text);
        const { lat, lng } = await getLatLngFromLocation(location);

        // Hitung radius dari lokasi default (contoh: China Lat/Lng) jika lat/lng tersedia
        const radius = lat && lng ? calculateRadius(lat, lng, CHINA_LAT, CHINA_LNG) : null;

        const articleData = {
          title: article.title || "No Title",
          disruptionType: disruptionType,
          url: article.url,
          imageUrl: article.urlToImage || "No Image",
          publishedDate: article.publishedAt || new Date().toISOString(),
          raw_text: text,
          text: await summarizeArticle(text),
          location: location,
          lat: lat || null,
          lng: lng || null,
          radius: radius || null,
          severity: severity || "Low",
          isdeleted: false,
        };

        articlesToSave.push(articleData);
        console.log(`Prepared article: ${article.title}`);
      }

      await saveArticlesToDatabase(articlesToSave);
      res.status(200).json({ message: "Articles processed successfully.", total: articlesToSave.length });
    } else {
      res.status(400).json({ message: "No articles found for the given date range." });
    }
  } catch (error) {
    console.error("Error scraping articles:", error.message);
    res.status(500).json({ message: "Error scraping articles." });
  }
};

/**
 * Get all articles from the database.
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @returns {JSON} List of all articles
 */
const getAllArticles = async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection(process.env.COLLECTION_NAME);

    const articles = await collection.find({ isdeleted: { $ne: true } }).toArray();
    res.status(200).json(articles);
  } catch (error) {
    console.error("Error fetching articles:", error.message);
    res.status(500).json({ message: "Error fetching articles." });
  }
};

/**
 * Get articles filtered by disruption type.
 * 
 * @param {Object} req Express request object, expects `disruptionType` as a query parameter
 * @param {Object} res Express response object
 * @returns {JSON} List of articles filtered by the specified disruption type
 */
const getFilteredArticles = async (req, res) => {
  const disruptionType = req.query.disruptionType;

  try {
    const db = getDB();
    const collection = db.collection(process.env.COLLECTION_NAME);

    const query = disruptionType
      ? { disruptionType, isdeleted: { $ne: true } }
      : { isdeleted: { $ne: true } };

    const articles = await collection.find(query).toArray();
    res.status(200).json(articles);
  } catch (error) {
    console.error("Error fetching articles:", error.message);
    res.status(500).json({ message: "Error fetching articles." });
  }
};

/**
 * Get a single article by its ID.
 * 
 * @param {Object} req Express request object, expects `id` as a path parameter
 * @param {Object} res Express response object
 * @returns {JSON} Article data if found
 */
const getArticleById = async (req, res) => {
  const articleId = req.params.id;

  try {
    const db = getDB(); // Ambil instance database
    const collection = db.collection(process.env.COLLECTION_NAME);

    // Cari artikel berdasarkan ObjectId dan pastikan belum dihapus
    const article = await collection.findOne({
      _id: new ObjectId(articleId), // Konversi ID ke ObjectId
      isdeleted: { $ne: true },    // Filter untuk artikel yang belum dihapus
    });

    if (article) {
      res.status(200).json(article);
    } else {
      res.status(404).json({ message: "Article not found." });
    }
  } catch (error) {
    console.error("Error getting article:", error.message);
    res.status(500).json({ message: "Error getting article." });
  }
};

/**
 * Delete an article (soft delete).
 * 
 * @param {Object} req Express request object, expects `id` as a path parameter
 * @param {Object} res Express response object
 * @returns {JSON} Deletion status message
 */
const deleteArticle = async (req, res) => {
  const articleId = req.params.id;

  try {
    const db = getDB();
    const collection = db.collection(process.env.COLLECTION_NAME);

    // Pastikan ObjectId dibuat dengan benar
    const result = await collection.updateOne(
      { _id: new ObjectId(articleId) },
      { $set: { isdeleted: true } }
    );

    if (result.modifiedCount > 0) {
      res.status(200).json({ message: `Article ${articleId} deleted successfully.` });
    } else {
      res.status(404).json({ message: "Article not found." });
    }
  } catch (error) {
    console.error("Error deleting article:", error.message);
    res.status(500).json({ message: "Error deleting article." });
  }
};

/**
 * Function to Delete All Articles (Development Purposes)
 * 
 * This function removes all articles from the MongoDB collection.
 * 
 * - It is primarily intended for development or testing purposes.
 * - Deletes all documents in the specified collection without any filters.
 * - Returns the count of deleted articles in the response.
 * 
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @returns {JSON} A success message and the total count of deleted articles.
 */
const deleteAllArticles = async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection(process.env.COLLECTION_NAME);

    // Hapus semua artikel dengan filter kosong {}
    const result = await collection.deleteMany({});
    console.log(`${result.deletedCount} articles deleted successfully.`);

    res.status(200).json({
      message: "All articles have been deleted successfully.",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting all articles:", error.message);
    res.status(500).json({ message: "Error deleting all articles." });
  }
};

module.exports = {
  scrapeAndSaveArticles,
  getAllArticles,
  getFilteredArticles,
  getArticleById,
  getKeywordCloud,
  deleteArticle,
  deleteAllArticles
};