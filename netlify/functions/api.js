// netlify/functions/api.js
const serverless = require('serverless-http');
const app = require('../../backend/server'); // <- path to the exported app

exports.handler = serverless(app);
