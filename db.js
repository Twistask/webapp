require("dotenv/config");
var PocketBase = require('pocketbase').default

const pb = new PocketBase(process.env.DB_CONN);

module.exports = pb;