const express = require('express');
const router = express.Router();
const { 
  scrapeAndSaveArticles, 
  getAllArticles, 
  getFilteredArticles,
  getArticleById,
  deleteArticle,
} = require('../controllers/articlesController.js');

// Route to scrape and save articles
router.post('/scrape', scrapeAndSaveArticles);

// Route to get all articles (with optional filtering)
router.get('/', getFilteredArticles);

// Route to get a single article by ID
router.get('/:id', getArticleById);

// Route to delete an article
router.delete('/:id', deleteArticle);

module.exports = router;