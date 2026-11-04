
const crypto = require('crypto');

const MAX_AGE_MS = 5 * 60 * 1000;

// HubSpot v3 URL normalization decodes only these characters.
const ENCODED_CHARACTERS = {
    '%3A': ':',
    '%2F': '/',
    '%3F': '?',
    '%40': '@',
    '%21': '!',
    '%24': '$',
    '%27': "'",
    '%28': '(',
    '%29': ')',
    '%2A': '*',
    '%2C': ',',
    '%3B': ';'
};

function normalizeHubSpotUrl(url) {
    return url
        .split('#')[0]
        .replace(
            /%3A|%2F|%3F|%40|%21|%24|%27|%28|%29|%2A|%2C|%3B/gi,
            (match) => ENCODED_CHARACTERS[match.toUpperCase()]
        );
}

function verifyHubSpotSignature(req) {
    const signature = req.get('x-hubspot-signature-v3');
    const timestamp = req.get('x-hubspot-request-timestamp');

    if (!signature || !timestamp || !/^\d+$/.test(timestamp)) {
        return false;
    }

    const timestampNumber = Number(timestamp);

    if (
        !Number.isSafeInteger(timestampNumber) ||
        Math.abs(Date.now() - timestampNumber) > MAX_AGE_MS
    ) {
        return false;
    }

    if (!Buffer.isBuffer(req.body)) {
        return false;
    }

    const publicUrl = process.env.HUBSPOT_PUBLIC_URL;

    if (!publicUrl) {
        throw new Error('HUBSPOT_PUBLIC_URL is not configured');
    }

    // Preserve the original request path and query string.
    const fullUrl = new URL(req.originalUrl, publicUrl).toString();
    const normalizedUrl = normalizeHubSpotUrl(fullUrl);

    const signedContent = Buffer.concat([
        Buffer.from(
            `${req.method}${normalizedUrl}`,
            'utf8'
        ),
        req.body,
        Buffer.from(timestamp, 'utf8')
    ]);

    const expectedSignature = crypto
        .createHmac(
            'sha256',
            process.env.HUBSPOT_CLIENT_SECRET
        )
        .update(signedContent)
        .digest('base64');

    const received = Buffer.from(signature, 'utf8');
    const expected = Buffer.from(expectedSignature, 'utf8');

    return (
        received.length === expected.length &&
        crypto.timingSafeEqual(received, expected)
    );
}

module.exports = {
    verifyHubSpotSignature
};
