// A simple in-memory store for upload sessions.
// For a production environment that needs to scale horizontally,
// this should be replaced with a distributed cache like Redis.
const uploadSessions = new Map();

/**
 * Stores the details of an upload session.
 * @param {string} id - The unique ID for the session.
 * @param {object} data - The session data to store.
 * @returns {void}
 */
const add = (id, data) => {
  uploadSessions.set(id, data);
};

/**
 * Retrieves the details of an upload session.
 * @param {string} id - The unique ID for the session.
 * @returns {object | undefined} The session data or undefined if not found.
 */
const get = (id) => {
  return uploadSessions.get(id);
};

/**
 * Removes an upload session from the store.
 * @param {string} id - The unique ID for the session.
 * @returns {void}
 */
const remove = (id) => {
  uploadSessions.delete(id);
};

module.exports = {
  add,
  get,
  remove,
};
