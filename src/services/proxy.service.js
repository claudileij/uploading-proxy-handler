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
const streamMultipartUpload = (req, session, resolve, reject) => {
  const { id } = req.params;
  const bb = busboy({ headers: req.headers, limits: { fileSize: session.maxSize } });

  bb.on('file', (fieldname, file, filename, encoding, mimetype) => {
    console.log(`Receiving file: ${filename}`);
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
      uploadStore.remove(id);
      console.error(err.message);
      req.unpipe(bb);
    });

    axios.put(session.s3PresignedUrl, passThrough, {
      headers: { 'Content-Type': mimetype },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    }).then(() => {
      console.log('Successfully uploaded to S3.');
      sendWebhook(session.webhook, { status: 'success', fileKey: session.fileKey, size: totalSize });
      uploadStore.remove(id);
    }).catch(err => {
      console.error('Error uploading to S3:', err.message);
      sendWebhook(session.webhook, { status: 'error', fileKey: session.fileKey, error: `S3 upload failed: ${err.message}` });
      uploadStore.remove(id);
    });
  });

  bb.on('finish', () => console.log('Busboy finished parsing the form.'));
  bb.on('error', err => {
    console.error('Busboy error:', err);
    reject(boom.badImplementation('Error parsing upload stream.'));
  });

  req.pipe(bb);
};

const streamPutUpload = (req, session, resolve, reject) => {
  const { id } = req.params;
  const passThrough = new PassThrough();
  req.pipe(passThrough);

  let totalSize = 0;
  req.on('data', (data) => {
    totalSize += data.length;
    if (totalSize > session.maxSize) {
      const err = boom.badRequest(`File size exceeds the limit of ${session.maxSize} bytes.`);
      sendWebhook(session.webhook, { status: 'error', fileKey: session.fileKey, error: err.message });
      uploadStore.remove(id);
      req.unpipe(passThrough);
      reject(err);
    }
  });

  resolve({ status: 'success', message: 'Upload received and is being processed.' });

  axios.put(session.s3PresignedUrl, passThrough, {
    headers: { 'Content-Type': req.headers['content-type'] },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  }).then(() => {
    console.log('Successfully uploaded to S3.');
    sendWebhook(session.webhook, { status: 'success', fileKey: session.fileKey, size: totalSize });
    uploadStore.remove(id);
  }).catch(err => {
    console.error('Error uploading to S3:', err.message);
    sendWebhook(session.webhook, { status: 'error', fileKey: session.fileKey, error: `S3 upload failed: ${err.message}` });
    uploadStore.remove(id);
  });
};

const streamUpload = (req) => {
  return new Promise((resolve, reject) => {
    const { id } = req.params;
    const session = uploadStore.get(id);

    if (!session) {
      return reject(boom.notFound('Upload session not found.'));
    }

    if (session.type === 'put') {
      streamPutUpload(req, session, resolve, reject);
    } else {
      streamMultipartUpload(req, session, resolve, reject);
    }
  });
};

module.exports = { streamUpload };
