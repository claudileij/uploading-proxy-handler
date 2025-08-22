const express = require('express');
const router = express.Router();
const ProxyController = require('../controllers/proxy.controller');
const validationHandler = require('../middlewares/validation.handler');
const { generateSchema } = require('../schemas/proxy.schema');

// Define the new proxy routes
router.post('/generate', validationHandler(generateSchema, 'body'), ProxyController.generate);

// Route for the client to upload the file to our service
router.post('/upload/:id', ProxyController.upload);

module.exports = router;
