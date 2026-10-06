/**
 * Escapes characters that have a special meaning in regular expressions.
 * User search input is passed through this before building a $regex query,
 * which prevents ReDoS patterns and regex injection (e.g. searching ".*").
 */
function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Case-insensitive "contains" regex built from (escaped) user input. */
function searchRegex(text) {
  return new RegExp(escapeRegex(text), 'i');
}

/**
 * Mongo filter matching people by first name, last name, full name
 * ("Juan Dela") or any extra field (e.g. email, phone).
 */
function nameSearchFilter(text, extraFields = []) {
  const pattern = escapeRegex(text);
  const regex = new RegExp(pattern, 'i');
  return {
    $or: [
      { firstName: regex },
      { lastName: regex },
      ...extraFields.map((field) => ({ [field]: regex })),
      {
        $expr: {
          $regexMatch: {
            input: { $concat: ['$firstName', ' ', '$lastName'] },
            regex: pattern,
            options: 'i',
          },
        },
      },
    ],
  };
}

module.exports = { escapeRegex, searchRegex, nameSearchFilter };
