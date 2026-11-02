
const hubspotService = require('../services/hubspot.service');

// GET /api/contacts
exports.getContacts = async (req, res) => {
    try {
        const limit = Number(req.query.limit || 10);
        const after = req.query.after || null;

        if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
            return res.status(400).json({
                success: false,
                message: 'Limit must be between 1 and 100'
            });
        }

        const data = await hubspotService.getContacts(
            limit,
            after
        );

        return res.json({
            success: true,
            data
        });

    } catch (error) {
        return handleHubSpotError(error, res);
    }
};

// POST /api/contacts
exports.createContact = async (req, res) => {
    try {
        const { email, firstname, lastname, phone } = req.body;

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'A valid email address is required'
            });
        }

        const properties = { email };

        if (firstname) properties.firstname = firstname;
        if (lastname) properties.lastname = lastname;
        if (phone) properties.phone = phone;

        const contact = await hubspotService.createContact(
            properties
        );

        return res.status(201).json({
            success: true,
            message: 'Contact created successfully',
            data: contact
        });

    } catch (error) {
        return handleHubSpotError(error, res);
    }
};

// PATCH /api/contacts/:id
exports.updateContact = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, firstname, lastname, phone } = req.body;

        const properties = {};

        if (email !== undefined) properties.email = email;
        if (firstname !== undefined) properties.firstname = firstname;
        if (lastname !== undefined) properties.lastname = lastname;
        if (phone !== undefined) properties.phone = phone;

        if (!Object.keys(properties).length) {
            return res.status(400).json({
                success: false,
                message: 'At least one property is required'
            });
        }

        if (
            email !== undefined &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email address'
            });
        }

        const contact = await hubspotService.updateContact(
            id,
            properties
        );

        return res.json({
            success: true,
            message: 'Contact updated successfully',
            data: contact
        });

    } catch (error) {
        return handleHubSpotError(error, res);
    }
};

// DELETE /api/contacts/:id
exports.deleteContact = async (req, res) => {
    try {
        await hubspotService.deleteContact(req.params.id);

        return res.json({
            success: true,
            message: 'Contact archived successfully'
        });

    } catch (error) {
        return handleHubSpotError(error, res);
    }
};

// Centralized error handling
function handleHubSpotError(error, res) {
    const status = error.response?.status || 500;
    const hubspotError = error.response?.data;

    console.error('HubSpot API error:', {
        status,
        message: hubspotError?.message || error.message
    });

    return res.status(status).json({
        success: false,
        message: hubspotError?.message || error.message,
        category: hubspotError?.category || null
    });
}
