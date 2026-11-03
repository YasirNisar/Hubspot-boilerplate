
const IORedis = require('ioredis');

const connection = new IORedis(
    process.env.REDIS_URL || 'redis://127.0.0.1:6379',
    {
        maxRetriesPerRequest: null,
        enableReadyCheck: true
    }
);

connection.on('connect', () => {
    console.log('Redis connected');
});

connection.on('error', (error) => {
    console.error('Redis error:', error.message);
});

module.exports = connection;
