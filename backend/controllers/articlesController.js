const pool = require("../config/db.js");
require("dotenv").config();
const OpenAI = require("openai");
const NewsAPI = require("newsapi");
const newsapi = new NewsAPI(process.env.NEWS_API_KEY);
const openai = new OpenAI(process.env.OPENAI_API_KEY);
const axios = require("axios");
const natural = require("natural");

const CHINA_LAT = 35.8617;
const CHINA_LNG = 104.1954;

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

//Utility function to get disruption types from database
const getCategoriesForPrompt = async () => {
  const categories = await pool.query(
    'SELECT category_name FROM disruption_categories WHERE isdeleted = FALSE'
  );

  return categories.rows.map(cat => `'${cat.category_name}'`).join(', ');
};

// [FUNCTIONAL] Function to process keyword frequencies
const getKeywordCloud = async (req, res) => {
  try {
    // Fetch URLs from the database
    const result = await pool.query(
      "SELECT url FROM articles WHERE isdeleted = false AND url IS NOT NULL"
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No articles found." });
    }

    const tokenizer = new natural.WordTokenizer();
    const stopWords = [
      "the", "and", "is", "to", "a", "of", "in", "on", "at", "by", "for", "with", 
      "as", "from", "this", "that", "it", "are", "was", "be", "or", "an", "but", 
      "not", "if", "so", "we", "you", "he", "she", "they", "them", "then"
    ];

    const wordFrequency = {};

    // Fetch content from each URL and tokenize it
    for (const row of result.rows) {
      try {
        const response = await axios.get(row.url);
        const htmlContent = response.data;

        // Extract text from the HTML (requires a library or custom logic)
        const textContent = extractTextFromHTML(htmlContent); // Implement this function

        const words = tokenizer.tokenize(textContent.toLowerCase());
        words.forEach((word) => {
          if (!stopWords.includes(word) && word.length > 2) {
            wordFrequency[word] = (wordFrequency[word] || 0) + 1;
          }
        });
      } catch (error) {
        console.warn(`Error fetching content from URL ${row.url}: ${error.message}`);
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
  try {
    const result = await pool.query(
      "SELECT id FROM articles WHERE url = $1 AND isdeleted = false",
      [url]
    );
    return result.rowCount > 0; // Return true if article exists
  } catch (error) {
    console.error("Error checking article existence:", error.message);
    return false;
  }
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
                  Format the response EXACTLY as: "Severity: <Low/Medium/High>, Location: <Country Name>".`;

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
  const categoriesList = await getCategoriesForPrompt();
  const prompt = `Based on the following information about an article: ${text}
                  
                  Classify the disruption described in this article into one of these categories:
                  ${categoriesList}

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
    return "Unknown"; // Return a default value if API fails
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
  const query = `
      INSERT INTO articles (title, text, raw_text, disruptiontype, severity, sourcename, publisheddate, url, imageurl, created_at, location, lat, lng, radius, isdeleted)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id;
      `;

  const promises = articles.map((article) => {
    const values = [
      article.title,
      article.text,
      article.raw_text,
      article.disruptionType,
      article.severity,
      article.sourceName,
      article.publishedDate,
      article.url,
      article.imageUrl,
      new Date(),
      article.location,
      article.lat || 0.0,
      article.lng || 0.0,
      article.radius || 0,
      article.isDeleted || false,
    ];

    return pool.query(query, values);
  });

  try {
    const results = await Promise.all(promises);
    results.forEach((result) => {
      const insertedId = result.rows[0].id;
      console.log(`Article saved to database with ID: ${insertedId}.`);
    });
  } catch (error) {
    console.error("Error saving articles to the database:", error.message);
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

      const userLat = req.body.userLat || CHINA_LAT;
      const userLng = req.body.userLng || CHINA_LNG;

      for (const article of response.articles) {
        const text = article.content || article.description || article.title || "No Content Available";

        try {
          const urlCheckResponse = await axios.get(article.url);
          if (urlCheckResponse.status !== 200) continue;
        } catch {
          continue;
        }

        const articleExists = await checkArticleExists(article.url);
        if (articleExists) continue;

        const disruptionType = await detectDisruptionType(text);
        if (disruptionType === "Unknown") continue;

        const { severity, location } = await detectSeverityAndLocation(text);
        const finalLocation = location || detectCountryFallback(text);
        const { lat, lng } = await getLatLngFromLocation(finalLocation);
        const radius = lat && lng ? Math.round(calculateRadius(userLat, userLng, lat, lng)) : null;
        const summarizedText = await summarizeArticle(text);

        const articleData = {
          title: article.title || "No Title",
          text: summarizedText,
          raw_text: text,
          location: finalLocation,
          disruptionType: disruptionType,
          severity: severity,
          sourceName: article.source.name || "Unknown",
          publishedDate: article.publishedAt || new Date(),
          url: article.url,
          imageUrl: article.urlToImage || "No Image",
          lat: lat,
          lng: lng,
          radius: radius,
        };

        articlesToSave.push(articleData);
      }

      await saveArticlesToDatabase(articlesToSave);
      res.status(200).json({ message: "Articles scraped and saved successfully.", total: articlesToSave.length });
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
    const result = await pool.query(
      "SELECT * FROM articles WHERE isdeleted = false ORDER BY created_at DESC"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error getting articles:", error.message);
    res.status(500).json({ message: "Error getting articles." });
  }
};

// [FUNCTIONAL] Function to get all articles from the database with optional filtering
const getFilteredArticles = async (req, res) => {
  const disruptionType = req.query.disruptionType;

  try {
    let query;
    let values = [];

    // If disruptionType is provided, filter by it
    if (disruptionType) {
      query =
        "SELECT * FROM articles WHERE disruptiontype = $1 AND isdeleted = false ORDER BY created_at DESC";
      values = [disruptionType];
    } else {
      // If no filtering, just get all articles
      query =
        "SELECT * FROM articles WHERE isdeleted = false ORDER BY created_at DESC";
    }

    const result = await pool.query(query, values);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error getting articles:", error.message);
    res.status(500).json({ message: "Error getting articles." });
  }
};

// [FUNCTIONAL] Function to get a single article by ID
const getArticleById = async (req, res) => {
  const articleId = req.params.id;

  try {
    const result = await pool.query(
      "SELECT * FROM articles WHERE id = $1 AND isdeleted = false",
      [articleId]
    );

    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
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
    const result = await pool.query(
      "UPDATE articles SET isdeleted = true WHERE id = $1",
      [articleId]
    );
    if (result.rowCount > 0) {
      res
        .status(200)
        .json({ message: `Article ${articleId} deleted successfully.` });
    } else {
      res.status(404).json({ message: "Article not found." });
    }
  } catch (error) {
    console.error("Error deleting article:", error.message);
    res.status(500).json({ message: "Error deleting article." });
  }
};

module.exports = {
  scrapeAndSaveArticles,
  getAllArticles,
  getFilteredArticles,
  getArticleById,
  getKeywordCloud,
  deleteArticle,
};
