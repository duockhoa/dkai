const express = require('express');
const router = express.Router();

const testResultsRouter = require('./testResult.routes');

// Use test router
router.use('/split-test-results', testResultsRouter);


module.exports = router;