const express = require('express');
const router = express.Router();

const testRouter = require('./test.routes');

// Use test router
router.use('/tests', testRouter);


module.exports = router;