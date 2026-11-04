const mongoose = require('mongoose');
const ContactService = require('../services/contact-mongo.service');

function handleError(res, error) {

    
    console.error('MongoDB duplicate key:', {
    keyPattern: error.keyPattern,
    keyValue: error.keyValue,
    message: error.message
});
    if (error.code === 11000) {
        return res.status(409).json({
            success: false,
            message: 'A contact with this email already exists.'
        });
    }

    if (error.name === 'ValidationError') {
        return res.status(422).json({
            success: false,
            message: error.message
        });
    }

    console.error('Mongo contact error:', error);

    return res.status(500).json({
        success: false,
        message: 'Internal server error.'
    });
}

async function getContacts(req, res) {
    try {
        const contacts = await ContactService.getContacts();

        return res.json({
            success: true,
            data: contacts
        });
    } catch (error) {
        return handleError(res, error);
    }
}

async function getContact(req, res) {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid contact ID.'
            });
        }

        const contact = await ContactService.getContactById(req.params.id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found.'
            });
        }

        return res.json({ success: true, data: contact });
    } catch (error) {
        return handleError(res, error);
    }
}

async function createContact(req, res) {
    try {
        const { firstname, lastname, email, phone } = req.body;

        if (!email || typeof email !== 'string') {
            return res.status(422).json({
                success: false,
                message: 'A valid email is required.'
            });
        }

        const contact = await ContactService.createContact({
            firstname,
            lastname,
            email,
            phone
        });

        return res.status(201).json({
            success: true,
            message: 'Contact created successfully.',
            data: contact
        });
    } catch (error) {
        return handleError(res, error);
    }
}

async function updateContact(req, res) {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid contact ID.'
            });
        }

        const allowedFields = ['firstname', 'lastname', 'email', 'phone'];
        const updates = {};

        for (const field of allowedFields) {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(422).json({
                success: false,
                message: 'Provide at least one valid field to update.'
            });
        }

        const contact = await ContactService.updateContact(
            req.params.id,
            updates
        );

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found.'
            });
        }

        return res.json({
            success: true,
            message: 'Contact updated successfully.',
            data: contact
        });
    } catch (error) {
        return handleError(res, error);
    }
}

async function deleteContact(req, res) {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid contact ID.'
            });
        }

        const contact = await ContactService.deleteContact(req.params.id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found.'
            });
        }

        return res.json({
            success: true,
            message: 'Contact deleted successfully.'
        });
    } catch (error) {
        return handleError(res, error);
    }
}

module.exports = {
    getContacts,
    getContact,
    createContact,
    updateContact,
    deleteContact
};