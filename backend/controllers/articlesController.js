const { getDB } = require("../config/db.js");
const { ObjectId } = require("mongodb");
require("dotenv").config();
const OpenAI = require("openai");
const NewsAPI = require("newsapi");
const newsapi = new NewsAPI(process.env.NEWS_API_KEY);
const openai = new OpenAI(process.env.OPENAI_API_KEY);
const axios = require("axios");
const natural = require("natural");

const CHINA_LAT = 35.8617;
const CHINA_LNG = 104.1954;

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

// Utility function to calculate distance between two points using Haversine formula
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

// Utility function to get latitude and longitude using Google Geocoding API
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

// [FUNCTIONAL] Function to process keyword frequencies
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

// Helper function to extract text from HTML
const extractTextFromHTML = (html) => {
  const text = html
    .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "") // Remove scripts
    .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, "") // Remove styles
    .replace(/<\/?[a-z][\s\S]*?>/gi, "") // Remove HTML tags
    .replace(/\s+/g, " ") // Collapse whitespace
    .trim();
  return text;
};

// Utility function to manually detect country if AI fails
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

// [FUNCTIONAL] Function to check if an article already exists in the database
const checkArticleExists = async (url) => {
  const db = getDB();
  const collection = db.collection(process.env.COLLECTION_NAME);
  const article = await collection.findOne({ url });
  return !!article; // Return true jika artikel ditemukan
};

// [FUNCTIONAL] Function to detect severity and location using OpenAI GPT-4o-Mini
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

// [FUNCTIONAL] Function to detect disruption type using OpenAI GPT-4o-Mini
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

// [FUNCTIONAL] Function to summarize an article using OpenAI GPT-4o-Mini
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

// [FUNCTIONAL] Function to save articles to the database (batch insertion)
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

// Function to scrape and save articles
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

// [FUNCTIONAL] Function to get all articles from the database
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

// [FUNCTIONAL] Function to get all articles from the database with optional filtering
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

// [FUNCTIONAL] Function to get a single article by ID
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

// Function to soft delete an article
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

// Function to delete all articles (development purposes)
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
