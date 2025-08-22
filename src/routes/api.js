const express = require('express');
const s3Routes = require('./s3.routes');

const router = express.Router();

// Mount S3 routes
router.use('/s3', s3Routes);

module.exports = router;
