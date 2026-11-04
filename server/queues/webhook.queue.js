
const { Queue } = require('bullmq');
const connection = require('../config/redis');

const webhookQueue = new Queue('hubspot-webhooks', {
    connection,
    defaultJobOptions: {
        attempts: 5,
        backoff: {
            type: 'exponential',
            delay: 2000
        },
        removeOnComplete: 500,
        removeOnFail: 1000
    }
});

module.exports = webhookQueue;
