const twilio = require('twilio');

// Initialize Twilio client
let twilioClient = null;

const initializeTwilio = () => {
    try {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;

        if (accountSid && authToken) {
            twilioClient = twilio(accountSid, authToken);
            console.log('[WhatsApp Service] Twilio initialized successfully');
            return true;
        } else {
            console.warn('[WhatsApp Service] Twilio credentials not found. WhatsApp messaging disabled.');
            return false;
        }
    } catch (error) {
        console.error('[WhatsApp Service] Failed to initialize Twilio:', error);
        return false;
    }
};

// Initialize on module load
initializeTwilio();

/**
 * Send WhatsApp message via Twilio
 * @param {string} phoneNumber - Recipient's phone number (with country code, e.g., +919876543210)
 * @param {string} message - Message content
 * @returns {Promise<boolean>} - Success status
 */
const sendWhatsAppMessage = async (phoneNumber, message) => {
    try {
        if (!twilioClient) {
            console.log('[WhatsApp] Service not initialized. Message not sent.');
            return false;
        }

        if (!phoneNumber || !message) {
            console.warn('[WhatsApp] Missing phone number or message');
            return false;
        }

        // Format phone number (ensure it starts with +)
        let formattedNumber = phoneNumber.trim();
        if (!formattedNumber.startsWith('+')) {
            // Assume Indian number if no country code
            formattedNumber = '+91' + formattedNumber.replace(/^0+/, '');
        }

        // Remove any spaces, dashes, or special characters
        formattedNumber = formattedNumber.replace(/[\s\-\(\)]/g, '');

        const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Twilio Sandbox default

        const messageResponse = await twilioClient.messages.create({
            body: message,
            from: twilioWhatsAppNumber,
            to: `whatsapp:${formattedNumber}`
        });

        console.log(`[WhatsApp] Message sent successfully to ${formattedNumber} | SID: ${messageResponse.sid}`);
        return true;

    } catch (error) {
        console.error('[WhatsApp] Failed to send message:', error.message);

        // Log specific Twilio errors
        if (error.code) {
            console.error(`[WhatsApp] Twilio Error Code: ${error.code}`);
        }

        return false;
    }
};

/**
 * Send attendance notification via WhatsApp
 * @param {Object} user - User object with name and contact_number
 * @param {string} status - Attendance status (Present, Absent, Late)
 * @param {string} studentName - Name of the student
 * @returns {Promise<boolean>}
 */
const sendAttendanceWhatsApp = async (user, status, studentName = null) => {
    try {
        const now = new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        const today = new Date().toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        const name = studentName || user.name;
        let message = '';

        if (status === 'Present') {
            message = `✅ *Attendance Update*\n\nDear Parent,\n\nYour ward *${name}* has reached school safely at *${now}* on ${today}.\n\n- School Administration`;
        } else if (status === 'Absent') {
            message = `❌ *Attendance Alert*\n\nDear Parent,\n\nYour ward *${name}* has been marked *ABSENT* today (${today}).\n\nIf this is unexpected, please contact the school immediately.\n\n- School Administration`;
        } else if (status === 'Late') {
            message = `⚠️ *Attendance Update*\n\nDear Parent,\n\nYour ward *${name}* arrived late to school at *${now}* on ${today}.\n\n- School Administration`;
        } else if (status === 'Half Day') {
            message = `📋 *Attendance Update*\n\nDear Parent,\n\nYour ward *${name}* was marked for *Half Day* attendance on ${today}.\n\n- School Administration`;
        }

        if (!message) {
            console.warn('[WhatsApp] Unknown attendance status:', status);
            return false;
        }

        return await sendWhatsAppMessage(user.contact_number, message);

    } catch (error) {
        console.error('[WhatsApp] Error sending attendance notification:', error);
        return false;
    }
};

/**
 * Send fee payment notification via WhatsApp
 * @param {string} phoneNumber - Parent's phone number
 * @param {string} studentName - Student name
 * @param {number} amount - Amount paid
 * @param {string} receiptNumber - Receipt number
 * @returns {Promise<boolean>}
 */
const sendFeePaymentWhatsApp = async (phoneNumber, studentName, amount, receiptNumber) => {
    try {
        const today = new Date().toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        const message = `💰 *Fee Payment Confirmation*\n\nDear Parent,\n\nFee payment received for *${studentName}*\n\n*Amount:* ₹${amount}\n*Receipt No:* ${receiptNumber}\n*Date:* ${today}\n\nThank you for your payment!\n\n- School Administration`;

        return await sendWhatsAppMessage(phoneNumber, message);

    } catch (error) {
        console.error('[WhatsApp] Error sending fee payment notification:', error);
        return false;
    }
};

/**
 * Send exam result notification via WhatsApp
 * @param {string} phoneNumber - Parent's phone number
 * @param {string} studentName - Student name
 * @param {string} examName - Exam name
 * @param {string} resultSummary - Brief result summary
 * @returns {Promise<boolean>}
 */
const sendExamResultWhatsApp = async (phoneNumber, studentName, examName, resultSummary) => {
    try {
        const message = `📊 *Exam Results Published*\n\nDear Parent,\n\nResults for *${examName}* are now available for *${studentName}*.\n\n${resultSummary}\n\nPlease login to the student portal to view detailed results.\n\n- School Administration`;

        return await sendWhatsAppMessage(phoneNumber, message);

    } catch (error) {
        console.error('[WhatsApp] Error sending exam result notification:', error);
        return false;
    }
};

module.exports = {
    sendWhatsAppMessage,
    sendAttendanceWhatsApp,
    sendFeePaymentWhatsApp,
    sendExamResultWhatsApp,
    initializeTwilio
};
