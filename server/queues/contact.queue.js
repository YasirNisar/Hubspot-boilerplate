
const { Queue } = require('bullmq');
const connection = require('../config/redis');

const contactQueue = new Queue('contact-sync', {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000
        },
        removeOnComplete: 100,
        removeOnFail: 500
    }
});

module.exports = contactQueue;
