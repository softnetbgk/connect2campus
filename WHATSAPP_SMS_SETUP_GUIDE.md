# WhatsApp & SMS Notification Setup Guide

## 📊 Cost Comparison (Per Message)

| Service | Cost per Message | Best For | Setup Difficulty |
|---------|-----------------|----------|------------------|
| **Fast2SMS** | ₹0.10 | Budget-conscious schools | ⭐ Easy |
| **MSG91** | ₹0.15 | Reliable SMS delivery | ⭐ Easy |
| **TextLocal** | ₹0.20 | Enterprise features | ⭐⭐ Medium |
| **WhatsApp Business API** | ₹0.30-0.80 (1000 free/month) | Rich messaging | ⭐⭐⭐ Hard |
| **Twilio WhatsApp** | ₹0.50-1.50 | Quick setup | ⭐⭐ Medium |

## 💰 Cost Estimation for Your School

**Example: 500 students, 20 school days/month**
- **SMS (Fast2SMS)**: 500 × 20 × ₹0.10 = **₹1,000/month**
- **WhatsApp (Twilio)**: 500 × 20 × ₹0.80 = **₹8,000/month**
- **Difference**: ₹7,000/month saved with SMS!

---

## 🎯 Recommended Setup (Best Value)

### **Option 1: SMS Only (Cheapest - RECOMMENDED)**
**Cost**: ₹1,000-1,500/month for 500 students
**Reliability**: ⭐⭐⭐⭐⭐

Use **Fast2SMS** or **MSG91** for all notifications.

#### Setup Steps:

1. **Sign up for Fast2SMS** (Cheapest)
   - Visit: https://www.fast2sms.com/
   - Sign up and verify your account
   - Get ₹10 free credits for testing
   - Purchase credits: ₹100 = 1000 SMS

2. **Get API Key**
   - Go to Dashboard → API Keys
   - Copy your API key

3. **Add to `.env` file**:
   ```env
   # SMS Configuration (Fast2SMS)
   SMS_PROVIDER=FAST2SMS
   FAST2SMS_API_KEY=your_api_key_here
   ```

4. **Update notificationService.js**:
   ```javascript
   const { sendAttendanceSMS } = require('./smsService');
   
   // In sendAttendanceNotification function:
   if (user.contact_number) {
       await sendAttendanceSMS(user, status);
   }
   ```

---

### **Option 2: WhatsApp Business API (Free Tier)**
**Cost**: FREE for first 1,000 conversations/month, then ₹0.30-0.80
**Reliability**: ⭐⭐⭐⭐

Best for schools with <50 students or for important alerts only.

#### Setup Steps:

1. **Create Meta Business Account**
   - Visit: https://business.facebook.com/
   - Create business account
   - Verify your business (requires documents)

2. **Set up WhatsApp Business API**
   - Go to Meta Business Suite
   - Add WhatsApp Business API
   - Get Phone Number Display Name approved
   - Get API credentials

3. **Add to `.env` file**:
   ```env
   # WhatsApp Business API
   WHATSAPP_BUSINESS_ACCOUNT_ID=your_account_id
   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
   WHATSAPP_ACCESS_TOKEN=your_access_token
   ```

4. **Use the whatsappService.js** (already created)

---

### **Option 3: Twilio WhatsApp (Quick Setup)**
**Cost**: ₹0.50-1.50 per message
**Reliability**: ⭐⭐⭐⭐⭐

Best for quick testing or small schools.

#### Setup Steps:

1. **Sign up for Twilio**
   - Visit: https://www.twilio.com/
   - Sign up (get $15 free credit)
   - Verify your phone number

2. **Enable WhatsApp Sandbox** (for testing):
   - Go to Console → Messaging → Try it out → Send a WhatsApp message
   - Follow instructions to join sandbox
   - Send "join <your-code>" to the Twilio WhatsApp number

3. **Get Credentials**:
   - Account SID: From Twilio Console
   - Auth Token: From Twilio Console
   - WhatsApp Number: `whatsapp:+14155238886` (sandbox)

4. **Add to `.env` file**:
   ```env
   # Twilio WhatsApp
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   ```

5. **For Production** (after testing):
   - Request WhatsApp Business Profile
   - Get your own WhatsApp number approved
   - Update `TWILIO_WHATSAPP_NUMBER` with your number

---

## 🔧 Implementation Guide

### Current Implementation Status

✅ **Already Implemented**:
- WhatsApp service (`whatsappService.js`)
- SMS service (`smsService.js`)
- Integration in `notificationService.js`

### Choose Your Configuration

Edit `backend/src/services/notificationService.js`:

```javascript
const { sendAttendanceSMS } = require('./smsService');
const { sendAttendanceWhatsApp } = require('./whatsappService');

const sendAttendanceNotification = async (user, status) => {
    try {
        // ... existing code ...

        // OPTION A: SMS Only (Cheapest)
        if (user.contact_number) {
            await sendAttendanceSMS(user, status);
        }

        // OPTION B: WhatsApp Only
        // if (user.contact_number) {
        //     await sendAttendanceWhatsApp(user, status);
        // }

        // OPTION C: Both SMS + WhatsApp (Maximum Reliability)
        // if (user.contact_number) {
        //     await sendAttendanceSMS(user, status);
        //     await sendAttendanceWhatsApp(user, status);
        // }

        // Always send push notification (FREE)
        await sendPushNotification(user.id, title, `${user.name} has ${message.toLowerCase()}.`);

    } catch (error) {
        console.error('Error sending attendance notification:', error);
    }
};
```

---

## 📦 Installation

Install required packages:

```bash
cd backend
npm install axios twilio
```

---

## 🧪 Testing

### Test SMS (Fast2SMS):
```javascript
// In backend, create test file: test_sms.js
const { sendSMS } = require('./src/services/smsService');

sendSMS('+919876543210', 'Test message from School Management System')
    .then(result => console.log('SMS sent:', result))
    .catch(err => console.error('Error:', err));
```

Run: `node test_sms.js`

### Test WhatsApp (Twilio):
```javascript
// In backend, create test file: test_whatsapp.js
const { sendWhatsAppMessage } = require('./src/services/whatsappService');

sendWhatsAppMessage('+919876543210', 'Test WhatsApp from School Management System')
    .then(result => console.log('WhatsApp sent:', result))
    .catch(err => console.error('Error:', err));
```

Run: `node test_whatsapp.js`

---

## 🎯 My Recommendation

**For your school, I recommend:**

1. **Start with Fast2SMS** (₹0.10/SMS)
   - Cheapest option
   - Reliable for Indian numbers
   - Easy setup (5 minutes)
   - ₹100 = 1000 messages

2. **Add WhatsApp later** (optional)
   - Use WhatsApp Business API free tier
   - Only for important alerts (exam results, fee reminders)
   - Saves money while providing rich messaging

3. **Keep Push Notifications** (FREE)
   - Already implemented
   - Works great for app users

---

## 💡 Pro Tips

1. **Save Money**: Use SMS for daily attendance, WhatsApp for important alerts
2. **Bulk Credits**: Buy SMS credits in bulk for better rates
3. **Monitor Usage**: Track message counts to optimize costs
4. **Fallback**: If SMS fails, try WhatsApp (and vice versa)

---

## 📞 Support

- **Fast2SMS**: support@fast2sms.com
- **MSG91**: support@msg91.com
- **Twilio**: https://support.twilio.com

---

## ✅ Next Steps

1. Choose your provider (I recommend Fast2SMS)
2. Sign up and get API credentials
3. Add credentials to `.env` file
4. Update `notificationService.js` with your choice
5. Test with a few numbers
6. Deploy and monitor!

**Total Setup Time**: 10-15 minutes
**Monthly Cost**: ₹1,000-1,500 (for 500 students with SMS)
