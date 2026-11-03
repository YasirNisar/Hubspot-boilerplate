
const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');

const {
    getTokens
} = require('../services/tokenStore');

// Start OAuth
router.get('/hubspot', authController.connectHubSpot);

// OAuth callback
router.get('/callback', authController.hubSpotCallback);

// Connection status
router.get('/status', async (req, res) => {
    try {
        const tokens = await getTokens();

        res.json({
            success: true,
            connected: Boolean(tokens?.access_token),
            hubId: tokens?.hub_id || null,
            scopes: tokens?.scopes || [],
            expiresAt: tokens?.expires_at || null
        });
    } catch (error) {
        console.error('Auth status error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Could not retrieve HubSpot status.'
        });
    }
});

// Manual refresh (development only)
router.post('/refresh', authController.refreshForTesting);

// Disconnect HubSpot
router.post('/disconnect', authController.disconnect);

module.exports = router;
