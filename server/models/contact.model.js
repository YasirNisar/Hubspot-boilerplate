const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
    {
        firstname: {
            type: String,
            trim: true,
            default: ''
        },
        lastname: {
            type: String,
            trim: true,
            default: ''
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            unique: true,
            index: true
        },
        phone: {
            type: String,
            trim: true,
            default: ''
        },
        hubspotId: {
            type: String,
            default: null,
            unique: true,
            sparse: true
        },
        sync: {
            status: {
                type: String,
                enum: ['pending', 'synced', 'failed'],
                default: 'pending'
            },
            direction: {
                type: String,
                enum: ['mongodb_to_hubspot', 'hubspot_to_mongodb', 'both', null],
                default: null
            },
            lastSyncedAt: {
                type: Date,
                default: null
            },
            lastError: {
                type: String,
                default: null
            }
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

module.exports = mongoose.model('Contact', contactSchema);