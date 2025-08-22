const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

/**
 * Creates an S3 client instance from request-specific credentials.
 * @param {object} s3Config - S3 configuration from the request body.
 * @returns {AWS.S3} A configured S3 client instance.
 */
const getS3Client = (s3Config) => {
  return new AWS.S3({
    accessKeyId: s3Config.accessKeyId,
    secretAccessKey: s3Config.secretAccessKey,
    region: s3Config.region,
    endpoint: s3Config.endpoint,
    s3ForcePathStyle: true, // Necessary for Wasabi and other S3-compatibles
    signatureVersion: 'v4',
  });
};

/**
 * Generates a presigned URL for uploading a file.
 * @param {object} uploadData - Data from the upload request body.
 * @returns {Promise<object>} An object containing the uploadUrl and fileKey.
 */
const generatePresignedUrl = async (uploadData) => {
  const { fileName, fileSize, fileType, s3 } = uploadData;
  const s3Client = getS3Client(s3);
  const fileKey = `uploads/${uuidv4()}-${fileName}`;

  const params = {
    Bucket: s3.bucket,
    Key: fileKey,
    ContentType: fileType,
    Expires: 60 * 5, // 5 minutes
  };

  // Wasabi and some other services might require ContentLength for presigned POSTs
  // but for PUT it's generally not required in the signature itself.
  // However, it's good practice to validate fileSize on the server side.
  if (fileSize > 100 * 1024 * 1024) { // 100 MB limit example
    throw new Error('File size exceeds the 100MB limit.');
  }

  const uploadUrl = await s3Client.getSignedUrlPromise('putObject', params);

  return { uploadUrl, fileKey };
};

/**
 * Verifies if a file exists in the S3 bucket and retrieves its metadata.
 * @param {object} verifyData - Data from the verify request body.
 * @returns {Promise<object>} File metadata.
 */
const verifyFile = async (verifyData) => {
  const { fileKey, s3 } = verifyData;
  const s3Client = getS3Client(s3);

  const params = {
    Bucket: s3.bucket,
    Key: fileKey,
  };

  try {
    const metadata = await s3Client.headObject(params).promise();
    return metadata;
  } catch (error) {
    if (error.code === 'NotFound') {
      // Throw a specific error for not found, to be handled by the controller
      const notFoundError = new Error('File not found');
      notFoundError.isBoom = true;
      notFoundError.output = {
        statusCode: 404,
        payload: {
          statusCode: 404,
          error: "Not Found",
          message: "File not found"
        }
      };
      throw notFoundError;
    }
    // Re-throw other errors
    throw error;
  }
};

/**
 * Deletes a file from the S3 bucket.
 * @param {object} deleteData - Data from the delete request body.
 * @returns {Promise<object>} Confirmation of deletion.
 */
const deleteFile = async (deleteData) => {
  const { fileKey, s3 } = deleteData;
  const s3Client = getS3Client(s3);

  const params = {
    Bucket: s3.bucket,
    Key: fileKey,
  };

  try {
    await s3Client.deleteObject(params).promise();
    return { message: 'File deleted successfully' };
  } catch (error) {
    // Log the error and re-throw it to be handled by the controller
    console.error('Error deleting file from S3:', error);
    throw new Error('Failed to delete file from S3.');
  }
};

module.exports = {
  generatePresignedUrl,
  verifyFile,
  deleteFile,
  getS3Client,
};
