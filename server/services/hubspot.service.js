
const axios = require('axios');

const { getValidAccessToken,refreshAccessToken } = require('./token.service');

const HUBSPOT_API_URL = 'https://api.hubapi.com';
const CONTACTS_ENDPOINT =
    '/crm/objects/2026-09/contacts';


function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryDelay(error, attempt) {
    const retryAfter = error.response?.headers?.['retry-after'];

    if (retryAfter) {
        const seconds = Number(retryAfter);

        if (Number.isFinite(seconds) && seconds >= 0) {
            return Math.min(seconds * 1000, 30000);
        }

        const retryDate = Date.parse(retryAfter);

        if (!Number.isNaN(retryDate)) {
            return Math.min(
                Math.max(retryDate - Date.now(), 0),
                30000
            );
        }
    }

    return Math.min(1000 * (2 ** attempt), 30000);
}


// Reusable authenticated request

async function hubspotRequest(config, retryAuth = true, retry429 = 2) {
    const accessToken = await getValidAccessToken();

    try {
        return await axios({
            ...config,
            url: `${HUBSPOT_API_URL}${config.url}`,
            headers: {
                ...config.headers,
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });
    } catch (error) {
        // Refresh once if HubSpot rejects the access token.
        if (error.response?.status === 401 && retryAuth) {
            await refreshAccessToken();

            return hubspotRequest(config, false, retry429);
        }

        // Respect Retry-After when HubSpot rate-limits us.
        if (error.response?.status === 429 && retry429 > 0) {
            const attempt = 2 - retry429;
            const delay = getRetryDelay(error, attempt);

            console.warn(
                `HubSpot rate limit reached. Retrying in ${delay}ms.`
            );

            await sleep(delay);

            return hubspotRequest(
                config,
                retryAuth,
                retry429 - 1
            );
        }

        throw error;
    }
}

// GET contacts
async function getContacts(limit = 10, after = null) {
    const params = {
        limit,
        properties: ['email', 'firstname', 'lastname', 'phone']
    };

    if (after) {
        params.after = after;
    }

    const response = await hubspotRequest({
        method: 'GET',
        url: CONTACTS_ENDPOINT,
        params
    });

    return response.data;
}

// CREATE contact
async function createContact(properties) {
    const response = await hubspotRequest({
        method: 'POST',
        url: CONTACTS_ENDPOINT,
        data: { properties }
    });

    return response.data;
}

// UPDATE contact
async function updateContact(contactId, properties) {
    const response = await hubspotRequest({
        method: 'PATCH',
        url: `${CONTACTS_ENDPOINT}/${encodeURIComponent(contactId)}`,
        data: { properties }
    });

    return response.data;
}

// ARCHIVE contact
async function deleteContact(contactId) {
    const response = await hubspotRequest({
        method: 'DELETE',
        url: `${CONTACTS_ENDPOINT}/${encodeURIComponent(contactId)}`
    });

    return {
        success: response.status === 204
    };
}

module.exports = {
    getContacts,
    createContact,
    updateContact,
    deleteContact
};
