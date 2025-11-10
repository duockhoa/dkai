const express = require('express');
const router = express.Router();
const { splitTestResult} = require('../controllers/testResult.controller');
const uploadFilesMidWare = require('../middlewares/uploadTestResults.middleware');

// Test Gemini API
router.post('/', uploadFilesMidWare, splitTestResult);


module.exports = router;