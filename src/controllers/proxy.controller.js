const boom = require('@hapi/boom');
const { v4: uuidv4 } = require('uuid');
const uploadStore = require('../services/upload.store');

/**
 * Generates a temporary upload URL for the proxy service.
 */
const generate = async (req, res, next) => {
  try {
    const id = uuidv4();
    const { fileKey, maxSize, s3PresignedUrl, webhook } = req.body;

    // Store the upload details
    uploadStore.add(id, {
      fileKey,
      maxSize,
      s3PresignedUrl,
      webhook,
      status: 'pending',
    });

    // Construct the upload URL for the client
    const uploadUrl = `${req.protocol}://${req.get('host')}/api/v1/upload/${id}`;

    res.status(200).json({
      status: 'success',
      uploadUrl,
      fileKey,
    });
  } catch (error) {
    next(boom.badImplementation('Could not generate upload URL', error));
  }
};

const ProxyService = require('../services/proxy.service');

/**
 * Handles the file upload from the client and proxies it to S3.
 */
const upload = async (req, res, next) => {
  try {
    // The service will handle the entire stream and respond to the client
    // once the upload to the proxy has started. The promise resolves with
    // the initial response data.
    const initialResponse = await ProxyService.streamUpload(req);
    res.status(200).json(initialResponse);
  } catch (error) {
    // Errors that happen before the stream starts (e.g., session not found)
    // will be caught here and passed to the error handler.
    next(error);
  }
};

module.exports = {
  generate,
  upload,
};
