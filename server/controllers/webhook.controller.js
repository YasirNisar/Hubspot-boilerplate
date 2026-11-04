
const webhookQueue = require('../queues/webhook.queue');

const {
    verifyHubSpotSignature
} = require('../services/webhookSignature.service');

async function receiveHubSpotWebhook(req, res) {
    try {
        // 1. Verify authenticity before parsing the body.
        if (!verifyHubSpotSignature(req)) {
            return res.status(401).json({
                success: false,
                message: 'Invalid HubSpot webhook signature.'
            });
        }

        // 2. Parse only after successful verification.
        let events;

        try {
            events = JSON.parse(req.body.toString('utf8'));
        } catch {
            return res.status(400).json({
                success: false,
                message: 'Invalid JSON payload.'
            });
        }

        if (!Array.isArray(events) || events.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Expected a non-empty webhook event array.'
            });
        }

        // 3. Add verified events to BullMQ.
        const jobs = events.map((event) => ({
            name: event.subscriptionType || 'hubspot-event',
            data: event,
            opts: {
                jobId: `hubspot-${event.portalId}-${event.eventId}`
            }
        }));

        await webhookQueue.addBulk(jobs);

        // 4. Acknowledge after successful queueing.
        return res.status(202).json({
            success: true,
            message: 'Webhook events accepted.',
            eventsQueued: jobs.length
        });

    } catch (error) {
        console.error('Webhook receiver error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Could not process webhook.'
        });
    }
}

module.exports = {
    receiveHubSpotWebhook
};
