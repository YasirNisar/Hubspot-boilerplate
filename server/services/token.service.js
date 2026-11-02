
const axios = require('axios');

const {
    getTokens,
    saveTokens,
    clearTokens
} = require('./tokenStore');

const TOKEN_URL =
    'https://api.hubspot.com/oauth/2026-09/token';

const REVOKE_URL =
    'https://api.hubspot.com/oauth/2026-09/token/revoke';

let refreshPromise = null;

// Refresh access token
async function performRefresh() {
    const tokens = getTokens();

    if (!tokens?.refresh_token) {
        throw new Error('Refresh token is not available');
    }

    const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokens.refresh_token,
        client_id: process.env.HUBSPOT_CLIENT_ID,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET
    });

    try {
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

        saveTokens(response.data);

        console.log('HubSpot access token refreshed');

        return response.data.access_token;

    } catch (error) {
        const status = error.response?.status;
        const oauthError = error.response?.data?.error;

        console.error('Token refresh failed:', {
            status,
            error: oauthError,
            description: error.response?.data?.error_description
        });

        // Invalid/revoked refresh token requires reauthorization.
        if (
            oauthError === 'invalid_grant' ||
            status === 401 ||
            status === 403
        ) {
            clearTokens();
        }

        throw new Error(
            oauthError === 'invalid_grant'
                ? 'HubSpot authorization expired. Please reconnect.'
                : 'Unable to refresh HubSpot access token'
        );
    }
}

// Prevent multiple simultaneous refresh requests.
function refreshAccessToken() {
    if (!refreshPromise) {
        refreshPromise = performRefresh().finally(() => {
            refreshPromise = null;
        });
    }

    return refreshPromise;
}

// Return a valid access token.
// Refresh 60 seconds before expiration.
async function getValidAccessToken() {
    const tokens = getTokens();

    if (!tokens?.access_token) {
        throw new Error('HubSpot is not connected');
    }

    const expiresSoon =
        tokens.expires_at <= Date.now() + 60 * 1000;

    if (expiresSoon) {
        return refreshAccessToken();
    }

    return tokens.access_token;
}

// Revoke HubSpot authorization and disconnect.
async function disconnectHubSpot() {
    const tokens = getTokens();

    if (!tokens) {
        return;
    }

    const params = new URLSearchParams({
        client_id: process.env.HUBSPOT_CLIENT_ID,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET,
        token: tokens.refresh_token,
        token_type_hint: 'refresh_token'
    });

    await axios.post(
        REVOKE_URL,
        params.toString(),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            timeout: 15000
        }
    );

    clearTokens();

    console.log('HubSpot disconnected and refresh token revoked');
}

module.exports = {
    refreshAccessToken,
    getValidAccessToken,
    disconnectHubSpot
};
