
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const authRoutes = require('./routes/auth.routes');
const contactRoutes = require('./routes/contact.routes');
const jobRoutes = require('./routes/job.routes');
const webhookRoutes = require('./routes/webhook.routes');
const { apiLimiter } =
    require('./middleware/rateLimit.middleware');

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

app.use('/api/webhooks', webhookRoutes);

app.use(express.json());
app.use('/api/auth',apiLimiter,authRoutes);
app.use('/api/contacts',apiLimiter, contactRoutes);
app.use('/api/jobs',apiLimiter, jobRoutes);

app.get('/api/health', (req, res) => {
    console.log('Health endpoint called');

    res.status(200).json({
        success: true,
        message: 'HubSpot integration server is running!',
        environment: process.env.NODE_ENV || 'development'
    });
});

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

server.on('error', (error) => {
    console.error('Server error:', error);
});

console.log('Express initialization completed');
