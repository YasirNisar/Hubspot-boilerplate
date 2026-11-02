
const express = require('express');
const router = express.Router();

const contactController = require('../controllers/contact.controller');

router.get('/', contactController.getContacts);

router.post('/', contactController.createContact);

router.patch('/:id', contactController.updateContact);

router.delete('/:id', contactController.deleteContact);

module.exports = router;
