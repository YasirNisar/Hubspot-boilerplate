
const crypto = require('crypto');
const redis = require('../config/redis');

const REDIS_KEY = 'hubspot:tokens';

const ENCRYPTION_KEY = Buffer.from(
    process.env.TOKEN_ENCRYPTION_KEY || '',
    'hex'
);

if (ENCRYPTION_KEY.length !== 32) {
    throw new Error(
        'TOKEN_ENCRYPTION_KEY must be a 32-byte hex key.'
    );
}

function encrypt(data) {
    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv(
        'aes-256-gcm',
        ENCRYPTION_KEY,
        iv
    );

    const encrypted = Buffer.concat([
        cipher.update(JSON.stringify(data), 'utf8'),
        cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    return [
        iv.toString('hex'),
        authTag.toString('hex'),
        encrypted.toString('hex')
    ].join(':');
}

function decrypt(value) {
    const [ivHex, authTagHex, encryptedHex] = value.split(':');

    const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        ENCRYPTION_KEY,
        Buffer.from(ivHex, 'hex')
    );

    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedHex, 'hex')),
        decipher.final()
    ]);

    return JSON.parse(decrypted.toString('utf8'));
}

async function saveTokens(tokens) {
    const previousTokens = await getTokens() || {};

    const updatedTokens = {
        ...previousTokens,
        ...tokens,

        refresh_token:
            tokens.refresh_token || previousTokens.refresh_token,

        expires_at: tokens.expires_in
            ? Date.now() + Number(tokens.expires_in) * 1000
            : previousTokens.expires_at
    };

    await redis.set(
        REDIS_KEY,
        encrypt(updatedTokens)
    );
}

async function getTokens() {
    const encrypted = await redis.get(REDIS_KEY);

    if (!encrypted) {
        return null;
    }

    return decrypt(encrypted);
}

async function clearTokens() {
    await redis.del(REDIS_KEY);
}

async function isConnected() {
    const tokens = await getTokens();

    return Boolean(tokens?.access_token);
}


module.exports = {
    saveTokens,
    getTokens,
    clearTokens,
    isConnected
};
