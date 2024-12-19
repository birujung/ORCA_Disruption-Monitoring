/**
 * Articles Routes
 * 
 * This module defines the API routes for managing and interacting with articles.
 * 
 * - Each route corresponds to a specific article-related operation such as scraping, retrieving, or deleting articles.
 * - The routes utilize controller functions for handling data processing and database operations.
 * 
 * Dependencies:
 * - Express.js for defining and handling API routes.
 * - Articles controller functions for processing and managing articles.
 */
const express = require('express');
const router = express.Router();
const { 
  scrapeAndSaveArticles, 
  getAllArticles, 
  getFilteredArticles,
  getArticleById,
  getKeywordCloud,
  deleteArticle,
  deleteAllArticles,
} = require('../controllers/articlesController.js');

/**
 * Route: Scrape and Save Articles
 * 
 * - Endpoint: `/scrape`
 * - Method: POST
 * - Description: Scrapes articles from external sources, processes them, and saves them to the database.
 * - Usage: Used for bulk importing articles into the system.
 */
router.post('/scrape', scrapeAndSaveArticles);

/**
 * Route: Get All Articles (with Optional Filtering)
 * 
 * - Endpoint: `/`
 * - Method: GET
 * - Description: Retrieves all articles from the database. Supports optional query-based filtering.
 * - Usage: Allows fetching articles with filters such as date range, location, and severity level.
 */
router.get('/', getFilteredArticles);

/**
 * Route: Get Keywords Cloud
 * 
 * - Endpoint: `/keywords`
 * - Method: GET
 * - Description: Generates a keyword cloud based on the content of articles.
 * - Usage: Used for data visualization of frequently occurring terms in the articles.
 */
router.get("/keywords", getKeywordCloud);

/**
 * Route: Get a Single Article by ID
 * 
 * - Endpoint: `/:id`
 * - Method: GET
 * - Description: Retrieves a single article by its ID.
 * - Usage: Allows users to fetch the details of a specific article.
 */
router.get('/:id', getArticleById);

/**
 * Route: Delete All Articles
 * 
 * - Endpoint: `/reset`
 * - Method: DELETE
 * - Description: Deletes all articles from the database.
 * - Usage: Primarily for development or testing purposes to reset the dataset.
 */
router.delete('/reset', deleteAllArticles);

/**
 * Route: Delete an Article
 * 
 * - Endpoint: `/:id`
 * - Method: DELETE
 * - Description: Deletes a single article by its ID (soft delete).
 * - Usage: Allows users to remove a specific article from the system.
 */
router.delete('/:id', deleteArticle);

module.exports = router;