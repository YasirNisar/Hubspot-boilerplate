const Contact = require('../models/contact.model');

async function getContacts() {
    return Contact.find().sort({ createdAt: -1 }).lean();
}

async function getContactById(id) {
    return Contact.findById(id).lean();
}

async function createContact(data) {
    return Contact.create({
        firstname: data.firstname || '',
        lastname: data.lastname || '',
        email: data.email,
        phone: data.phone || '',
        sync: {
            status: 'pending',
            direction: 'mongodb_to_hubspot'
        }
    });
}

async function updateContact(id, data) {
    return Contact.findByIdAndUpdate(
        id,
        {
            $set: {
                firstname: data.firstname,
                lastname: data.lastname,
                email: data.email,
                phone: data.phone,
                'sync.status': 'pending',
                'sync.direction': 'mongodb_to_hubspot'
            }
        },
        {
            returnDocument: 'after',
    runValidators: true
        }
    );
}

async function deleteContact(id) {
    return Contact.findByIdAndDelete(id);
}

module.exports = {
    getContacts,
    getContactById,
    createContact,
    updateContact,
    deleteContact
};