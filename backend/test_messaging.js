/**
 * Test script for SMS and WhatsApp notifications
 * Run: node test_messaging.js
 */

require('dotenv').config();
const { sendAttendanceSMS } = require('./src/services/smsService');
const { sendAttendanceWhatsApp } = require('./src/services/whatsappService');

// Test configuration
const TEST_USER = {
    name: 'Rahul Kumar',
    contact_number: '+919876543210', // Replace with your test number
    id: 1
};

const TEST_STATUS = 'Present'; // Options: Present, Absent, Late

async function testMessaging() {
    console.log('🧪 Testing Messaging Services...\n');
    console.log('Configuration:');
    console.log(`- SMS Provider: ${process.env.SMS_PROVIDER || 'Not configured'}`);
    console.log(`- SMS Enabled: ${process.env.ENABLE_SMS !== 'false'}`);
    console.log(`- WhatsApp Enabled: ${process.env.ENABLE_WHATSAPP === 'true'}`);
    console.log(`\nTest User: ${TEST_USER.name}`);
    console.log(`Test Number: ${TEST_USER.contact_number}`);
    console.log(`Test Status: ${TEST_STATUS}\n`);
    console.log('─'.repeat(50));

    // Test SMS
    if (process.env.ENABLE_SMS !== 'false') {
        console.log('\n📱 Testing SMS...');
        try {
            const smsResult = await sendAttendanceSMS(TEST_USER, TEST_STATUS);
            if (smsResult) {
                console.log('✅ SMS sent successfully!');
            } else {
                console.log('❌ SMS failed (check configuration)');
            }
        } catch (error) {
            console.error('❌ SMS Error:', error.message);
        }
    } else {
        console.log('\n📱 SMS is disabled in configuration');
    }

    // Test WhatsApp
    if (process.env.ENABLE_WHATSAPP === 'true') {
        console.log('\n💬 Testing WhatsApp...');
        try {
            const whatsappResult = await sendAttendanceWhatsApp(TEST_USER, TEST_STATUS);
            if (whatsappResult) {
                console.log('✅ WhatsApp sent successfully!');
            } else {
                console.log('❌ WhatsApp failed (check configuration)');
            }
        } catch (error) {
            console.error('❌ WhatsApp Error:', error.message);
        }
    } else {
        console.log('\n💬 WhatsApp is disabled in configuration');
    }

    console.log('\n' + '─'.repeat(50));
    console.log('\n✨ Testing complete!\n');
    console.log('Next steps:');
    console.log('1. Check your phone for messages');
    console.log('2. Verify the message format and content');
    console.log('3. If successful, update .env with your production credentials');
    console.log('4. Deploy and start sending real notifications!\n');
}

// Run tests
testMessaging()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    });
