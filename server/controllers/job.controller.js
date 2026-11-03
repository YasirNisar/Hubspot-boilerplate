
const contactQueue = require('../queues/contact.queue');

async function enqueueContactSync(req, res) {
    try {
        const { email, firstname, lastname, phone } = req.body;

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(422).json({
                success: false,
                message: 'A valid email is required.'
            });
        }

        const properties = {
            email,
            ...(firstname && { firstname }),
            ...(lastname && { lastname }),
            ...(phone && { phone })
        };

        const job = await contactQueue.add('create-contact', {
            properties
        });

        return res.status(202).json({
            success: true,
            message: 'Contact sync job added to queue.',
            jobId: job.id
        });
    } catch (error) {
        console.error('Queue error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Could not enqueue contact job.'
        });
    }
}

async function getJobStatus(req, res) {
    try {
        const job = await contactQueue.getJob(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found.'
            });
        }

        const state = await job.getState();

        return res.json({
            success: true,
            jobId: job.id,
            state,
            result: job.returnvalue || null,
            error: job.failedReason || null
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Could not retrieve job status.'
        });
    }
}

module.exports = {
    enqueueContactSync,
    getJobStatus
};
