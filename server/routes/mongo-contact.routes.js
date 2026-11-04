const express = require('express');
const controller = require('../controllers/mongo-contact.controller');

const router = express.Router();

router.get('/', controller.getContacts);
router.get('/:id', controller.getContact);
router.post('/', controller.createContact);
router.patch('/:id', controller.updateContact);
router.delete('/:id', controller.deleteContact);

module.exports = router;