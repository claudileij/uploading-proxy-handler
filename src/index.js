const express = require('express');
const morgan = require('morgan');
const apiRoutes = require('./routes/api');
const { logErrors, errorHandler, boomErrorHandler } = require('./middlewares/error.handler');
const cors = require('cors')
const app = express();
const port = process.env.PORT || 3000;

// Middleware for logging requests
app.use(cors());

app.use(morgan('dev'));

// Middleware for parsing JSON bodies
app.use(express.json());

// Main route for the API
app.use('/api/v1', apiRoutes);

// Error handling middlewares
app.use(logErrors);
app.use(boomErrorHandler);
app.use(errorHandler);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
