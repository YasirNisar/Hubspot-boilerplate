
let hubspotTokens = null;

function saveTokens(tokens) {
    const previousTokens = hubspotTokens || {};

    hubspotTokens = {
        ...previousTokens,
        ...tokens,

        // Preserve the existing refresh token if HubSpot
        // doesn't return a new one.
        refresh_token:
            tokens.refresh_token || previousTokens.refresh_token,

        expires_at: Date.now() + (Number(tokens.expires_in) * 1000)
    };
}

function getTokens() {
    return hubspotTokens;
}

function clearTokens() {
    hubspotTokens = null;
}

function isConnected() {
    return Boolean(hubspotTokens?.access_token);
}

module.exports = {
    saveTokens,
    getTokens,
    clearTokens,
    isConnected
};
