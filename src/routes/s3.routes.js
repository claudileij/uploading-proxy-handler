const express = require('express');
const router = express.Router();

const S3Controller = require('../controllers/s3.controller');
const validationHandler = require('../middlewares/validation.handler');
const { uploadSchema, verifySchema, deleteSchema } = require('../schemas/s3.schema');

// Define S3 routes
router.post('/upload', validationHandler(uploadSchema, 'body'), S3Controller.upload);
router.post('/verify', validationHandler(verifySchema, 'body'), S3Controller.verify);
router.delete('/file', validationHandler(deleteSchema, 'body'), S3Controller.deleteFile);

module.exports = router;
