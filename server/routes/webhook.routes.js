
const express = require('express');
const router = express.Router();

const webhookController =
    require('../controllers/webhook.controller');

router.post(
    '/hubspot',
    express.raw({
        type: 'application/json',
        limit: '1mb'
    }),
    webhookController.receiveHubSpotWebhook
);

module.exports = router;
