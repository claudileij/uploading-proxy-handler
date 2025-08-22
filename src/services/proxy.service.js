const axios = require('axios');
const busboy = require('busboy');
const { PassThrough } = require('stream');
const uploadStore = require('./upload.store');
const { sendWebhook } = require('./webhook.service');
const boom = require('@hapi/boom');

/**
 * Handles the streaming of the file from the client to the S3 presigned URL.
 * @param {object} req - The Express request object.
 * @returns {Promise<void>}
 */
const streamUpload = (req) => {
  return new Promise((resolve, reject) => {
    const { id } = req.params;
    const session = uploadStore.get(id);

    if (!session) {
      return reject(boom.notFound('Upload session not found.'));
    }

    const bb = busboy({ headers: req.headers, limits: { fileSize: session.maxSize } });

    bb.on('file', (fieldname, file, filename, encoding, mimetype) => {
      console.log(`Receiving file: ${filename}`);

      // Immediately respond to the client that we've started processing
      resolve({ status: 'success', message: 'Upload received and is being processed.' });

      const passThrough = new PassThrough();
      file.pipe(passThrough);

      let totalSize = 0;
      file.on('data', (data) => {
        totalSize += data.length;
      });

      file.on('limit', () => {
        const err = boom.badRequest(`File size exceeds the limit of ${session.maxSize} bytes.`);
        sendWebhook(session.webhook, { status: 'error', fileKey: session.fileKey, error: err.message });
        uploadStore.remove(id); // Clean up
        // We can't easily reject the promise here as the client response has been sent
        // but we can ensure the upload to S3 is aborted.
        console.error(err.message);
        req.unpipe(bb); // Stop processing further
      });

      // Start the async upload to S3
      console.log(`Streaming file to S3 presigned URL...`);
      axios.put(session.s3PresignedUrl, passThrough, {
        headers: {
          'Content-Type': mimetype,
        },
        maxBodyLength: session.maxSize,
        maxContentLength: session.maxSize,
      }).then(() => {
        console.log('Successfully uploaded to S3.');
        sendWebhook(session.webhook, { status: 'success', fileKey: session.fileKey, size: totalSize });
        uploadStore.remove(id); // Clean up successful session
      }).catch(err => {
        console.error('Error uploading to S3:', err.message);
        sendWebhook(session.webhook, { status: 'error', fileKey: session.fileKey, error: `S3 upload failed: ${err.message}` });
        uploadStore.remove(id); // Clean up failed session
      });
    });

    bb.on('finish', () => {
      console.log('Busboy finished parsing the form.');
    });

    bb.on('error', err => {
      console.error('Busboy error:', err);
      reject(boom.badImplementation('Error parsing upload stream.'));
    });

    req.pipe(bb);
  });
};

module.exports = { streamUpload };
