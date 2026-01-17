// Firebase Deployment Trigger: Blaze Plan Active
require('dotenv').config();
const { onRequest } = require('firebase-functions/v2/https');
const app = require('./src/app');

// Expose Express App as a single Cloud Function named 'api'
exports.api = onRequest({
    cors: true,
    region: "us-central1" // Or your preferred region
}, app);
