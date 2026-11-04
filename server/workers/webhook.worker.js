
require('dotenv').config();

const { Worker } = require('bullmq');
const connection = require('../config/redis');

const worker = new Worker(
    'hubspot-webhooks',
    async (job) => {
        const event = job.data;

        console.log('Processing HubSpot event:', {
            eventId: event.eventId,
            portalId: event.portalId,
            eventType: event.subscriptionType,
            objectId: event.objectId
        });

        // We'll add actual contact synchronization here.
        return {
            success: true,
            eventId: event.eventId,
            eventType: event.subscriptionType
        };
    },
    {
        connection,
        concurrency: 5
    }
);

worker.on('completed', (job, result) => {
    console.log(`Webhook job ${job.id} completed:`, result);
});

worker.on('failed', (job, error) => {
    console.error(`Webhook job ${job?.id} failed:`, error.message);
});

worker.on('error', (error) => {
    console.error('Webhook worker error:', error.message);
});

console.log('HubSpot webhook worker started');
