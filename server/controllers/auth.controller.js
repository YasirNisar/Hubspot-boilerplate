
const crypto = require('crypto');
const axios = require('axios');

const { saveTokens } = require('../services/tokenStore');
const {
    refreshAccessToken,
    disconnectHubSpot
} = require('../services/token.service');

const { getTokens } = require('../services/tokenStore');
const TOKEN_URL = 'https://api.hubapi.com/oauth/2026-09/token';

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth'
};

// STEP 1: Redirect user to HubSpot
exports.connectHubSpot = (req, res) => {
    try {
        const state = crypto.randomBytes(32).toString('hex');

        res.cookie('hubspot_oauth_state', state, {
            ...cookieOptions,
            maxAge: 10 * 60 * 1000
        });

        const authorizationUrl = new URL(
            'https://app.hubspot.com/oauth/authorize'
        );

        authorizationUrl.searchParams.set(
            'client_id',
            process.env.HUBSPOT_CLIENT_ID
        );

        authorizationUrl.searchParams.set(
            'redirect_uri',
            process.env.HUBSPOT_REDIRECT_URI
        );

        authorizationUrl.searchParams.set(
            'scope',
            process.env.HUBSPOT_SCOPES
        );

        authorizationUrl.searchParams.set(
            'response_type',
            'code'
        );

        authorizationUrl.searchParams.set('state', state);

        return res.redirect(authorizationUrl.toString());

    } catch (error) {
        console.error('OAuth initialization failed:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Unable to initialize HubSpot OAuth'
        });
    }
};

// STEP 2: Handle HubSpot callback
exports.hubSpotCallback = async (req, res) => {
    try {
        const { code, state, error } = req.query;

        const storedState = req.headers.cookie
            ?.split(';')
            .map(cookie => cookie.trim())
            .find(cookie => cookie.startsWith('hubspot_oauth_state='))
            ?.split('=')
            .slice(1)
            .join('=');

        res.clearCookie('hubspot_oauth_state', cookieOptions);

        // User denied authorization
        if (error) {
            return res.redirect(
                `${process.env.FRONTEND_URL}/?hubspot=denied`
            );
        }

        // Validate OAuth state
        if (
            typeof state !== 'string' ||
            typeof storedState !== 'string'
        ) {
            return res.status(403).json({
                success: false,
                message: 'Invalid OAuth state'
            });
        }

        const received = Buffer.from(state);
        const expected = Buffer.from(
            decodeURIComponent(storedState)
        );

        if (
            received.length !== expected.length ||
            !crypto.timingSafeEqual(received, expected)
        ) {
            return res.status(403).json({
                success: false,
                message: 'OAuth state verification failed'
            });
        }

        if (typeof code !== 'string' || !code) {
            return res.status(400).json({
                success: false,
                message: 'Authorization code is missing'
            });
        }

        // Exchange authorization code for tokens
        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: process.env.HUBSPOT_CLIENT_ID,
            client_secret: process.env.HUBSPOT_CLIENT_SECRET,
            redirect_uri: process.env.HUBSPOT_REDIRECT_URI,
            code
        });

        const response = await axios.post(
            TOKEN_URL,
            params.toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                timeout: 15000
            }
        );

        // Store tokens on backend
        saveTokens(response.data);

        console.log('HubSpot OAuth successful');
        console.log('Connected Hub ID:', response.data.hub_id);

        return res.redirect(
            `${process.env.FRONTEND_URL}/?hubspot=connected`
        );

    } catch (error) {
        console.error(
            'HubSpot OAuth callback failed:',
            error.response?.data?.error || error.message
        );

        return res.redirect(
            `${process.env.FRONTEND_URL}/?hubspot=error`
        );
    }
};



// Development-only: manually test token refresh
exports.refreshForTesting = async (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
        return res.status(404).json({
            success: false,
            message: 'Not found'
        });
    }

    try {
        await refreshAccessToken();

        return res.json({
            success: true,
            message: 'Access token refreshed successfully',
            expiresAt: getTokens().expires_at
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Disconnect HubSpot
exports.disconnect = async (req, res) => {
    try {
        await disconnectHubSpot();

        return res.json({
            success: true,
            message: 'HubSpot disconnected successfully'
        });

    } catch (error) {
        console.error('Disconnect failed:', error.message);

        return res.status(502).json({
            success: false,
            message: 'Unable to revoke HubSpot authorization'
        });
    }
};
