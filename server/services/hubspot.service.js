
const axios = require('axios');

const { getValidAccessToken } = require('./token.service');

const HUBSPOT_API_URL = 'https://api.hubapi.com';
const CONTACTS_ENDPOINT =
    '/crm/objects/2026-09/contacts';

// Reusable authenticated request
async function hubspotRequest(config, retry = true) {
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
        // If token was rejected, refresh once and retry.
        if (error.response?.status === 401 && retry) {
            const { refreshAccessToken } =
                require('./token.service');

            await refreshAccessToken();

            return hubspotRequest(config, false);
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
