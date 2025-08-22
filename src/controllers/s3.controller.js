const S3Service = require('../services/s3.service');
const { sendWebhook } = require('../services/webhook.service');
const boom = require('@hapi/boom');

/**
 * Handles the file upload request.
 * Generates a presigned URL and sends a webhook.
 */
const upload = async (req, res, next) => {
  const { fileName, fileSize, s3, webhook } = req.body;

  try {
    // Generate the presigned URL
    const { uploadUrl, fileKey } = await S3Service.generatePresignedUrl(req.body);

    // Immediately respond to the client
    res.status(200).json({
      status: 'success',
      uploadUrl,
      fileKey,
    });

    // Send success webhook in the background
    sendWebhook(webhook, {
      status: 'success',
      fileName,
      fileKey,
      fileSize,
      bucket: s3.bucket,
    });

  } catch (error) {
    // Send error webhook
    sendWebhook(webhook, {
      status: 'error',
      error: error.message,
      fileName: fileName || 'unknown',
    });

    // Pass error to the global error handler
    next(boom.badImplementation('Failed to generate presigned URL', error));
  }
};

/**
 * Handles the file verification request.
 * Checks if the file exists and returns its metadata.
 */
const verify = async (req, res, next) => {
  try {
    const metadata = await S3Service.verifyFile(req.body);
    res.status(200).json({
      status: 'success',
      metadata: {
        ETag: metadata.ETag,
        LastModified: metadata.LastModified,
        Size: metadata.ContentLength,
      },
    });
  } catch (error) {
    // If the service threw a not found error, it will be handled by the boom error handler
    // Otherwise, wrap it in a badImplementation error
    next(error.isBoom ? error : boom.badImplementation('Failed to verify file', error));
  }
};

/**
 * Handles the file deletion request.
 */
const deleteFile = async (req, res, next) => {
  try {
    const result = await S3Service.deleteFile(req.body);
    res.status(200).json({
      status: 'success',
      ...result,
    });
  } catch (error) {
    next(boom.badImplementation('Failed to delete file', error));
  }
};

module.exports = {
  upload,
  verify,
  deleteFile,
};
