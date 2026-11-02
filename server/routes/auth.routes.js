
const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');

const {
    isConnected,
    getTokens
} = require('../services/tokenStore');

// Start OAuth
router.get('/hubspot', authController.connectHubSpot);

// OAuth callback
router.get('/callback', authController.hubSpotCallback);

// Connection status
router.get('/status', (req, res) => {
    const tokens = getTokens();

    res.json({
        success: true,
        connected: isConnected(),
        hubId: tokens?.hub_id || null,
        scopes: tokens?.scopes || [],
        expiresAt: tokens?.expires_at || null
    });
});

// Manual refresh (development only)
router.post('/refresh', authController.refreshForTesting);

// Disconnect HubSpot
router.post('/disconnect', authController.disconnect);

module.exports = router;
