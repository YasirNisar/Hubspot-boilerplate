
require('dotenv').config();

const { Worker } = require('bullmq');
const connection = require('../config/redis');
const { createContact } = require('../services/hubspot.service');

const worker = new Worker(
    'contact-sync',
    async (job) => {
        console.log(`Processing job: ${job.id}`);

        const contact = await createContact(job.data.properties);

        console.log(`Contact created: ${contact.id}`);

        return {
            contactId: contact.id,
            email: contact.properties?.email
        };
    },
    {
        connection,
        concurrency: 5
    }
);

worker.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed:`, result);
});

worker.on('failed', (job, error) => {
    console.error(`Job ${job?.id} failed:`, error.message);
});

worker.on('error', (error) => {
    console.error('Worker error:', error.message);
});

console.log('Contact worker started');
