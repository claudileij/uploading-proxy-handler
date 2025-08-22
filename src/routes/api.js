const express = require('express');
const proxyRoutes = require('./proxy.routes');

const router = express.Router();

// Mount Proxy routes
router.use('/', proxyRoutes); // Mount at the root of /api/v1

module.exports = router;
