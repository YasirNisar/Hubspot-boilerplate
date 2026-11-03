
const express = require('express');
const router = express.Router();

const jobController = require('../controllers/job.controller');

router.post('/contacts', jobController.enqueueContactSync);
router.get('/:id', jobController.getJobStatus);

module.exports = router;

