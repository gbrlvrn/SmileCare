/**
 * Helpers that turn an axios error into something the UI can show.
 * The API error envelope is: { success:false, message, errors?: [{ field, message }] }
 */

/**
 * Returns a human-readable message for any axios/JS error.
 * @param {unknown} err
 * @param {string} [fallback]
 * @returns {string}
 */
export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (!err) return fallback;

  // The server answered with our error envelope
  const serverMessage = err.response?.data?.message;
  if (serverMessage) return serverMessage;

  if (err.response?.status === 429) return 'Too many requests. Please wait a moment and try again.';
  if (err.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
  // No response at all → network error / server offline
  if (err.request && !err.response) return 'Cannot reach the server. Please check your connection.';

  return err.message || fallback;
}

/**
 * Maps a 422 `errors[]` array to an object: { email: 'Email is required', ... }.
 * Only the first message per field is kept.
 * @param {unknown} err
 * @returns {Record<string, string>}
 */
export function getFieldErrors(err) {
  const list = err?.response?.data?.errors;
  if (!Array.isArray(list)) return {};

  return list.reduce((acc, item) => {
    if (item?.field && !acc[item.field]) acc[item.field] = item.message;
    return acc;
  }, {});
}
