require('dotenv').config();

const connectDatabase = require('./config/database');
const Contact = require('./models/contact.model');

async function testContact() {
    try {
        await connectDatabase();

        const contact = await Contact.create({
            firstname: 'Test',
            lastname: 'Contact',
            email: `test-${Date.now()}@example.com`,
            phone: '+1234567890'
        });

        console.log('Created contact:', contact);

        const found = await Contact.findById(contact._id);
        console.log('Retrieved contact:', found);

        await Contact.findByIdAndDelete(contact._id);
        console.log('Test contact deleted successfully');
    } catch (error) {
        console.error('Contact test failed:', error.message);
        process.exitCode = 1;
    } finally {
        const mongoose = require('mongoose');
        await mongoose.disconnect();
    }
}

testContact();