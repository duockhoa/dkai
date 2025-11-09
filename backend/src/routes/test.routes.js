const express = require('express');
const router = express.Router();
const { testGemini} = require('../controllers/test.controller');

// Test Gemini API
router.get('/', testGemini);


module.exports = router;