// PocketBase record ids are alphanumeric (plus - and _ for custom ids).
// Route params/body fields that get interpolated into PocketBase filter
// strings (see tools/db.js) must be validated against this before use,
// otherwise a crafted id can break out of the quoted filter.
const RECORD_ID_PATTERN = /^[a-zA-Z0-9_-]{1,60}$/;

export const isValidRecordId = (id) => typeof id === "string" && RECORD_ID_PATTERN.test(id);
