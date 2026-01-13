# 🚀 Quick Setup - 5 Minutes to Live Messaging!

## Step 1: Sign Up (2 minutes)
Go to: **https://www.fast2sms.com/**
- Click "Sign Up"
- Enter your details
- Verify email and phone
- Get ₹10 free credits!

## Step 2: Get API Key (1 minute)
- Login to Fast2SMS dashboard
- Click on "Dev API" or "API Keys"
- Copy your API key

## Step 3: Configure (1 minute)
Add to `backend/.env`:
```env
ENABLE_SMS=true
SMS_PROVIDER=FAST2SMS
FAST2SMS_API_KEY=paste_your_key_here
```

## Step 4: Install (30 seconds)
```bash
cd backend
npm install axios
```

## Step 5: Test (30 seconds)
Edit `backend/test_messaging.js` - change phone number to yours:
```javascript
contact_number: '+919876543210', // Your number
```

Run test:
```bash
node test_messaging.js
```

## Step 6: Deploy (30 seconds)
Restart backend:
```bash
npm start
```

## ✅ Done!
Now when you mark attendance, parents get SMS automatically!

---

## 💰 Pricing Cheat Sheet

| Provider | Cost | Sign Up |
|----------|------|---------|
| Fast2SMS | ₹0.10/SMS | https://www.fast2sms.com/ |
| MSG91 | ₹0.15/SMS | https://msg91.com/ |
| TextLocal | ₹0.20/SMS | https://www.textlocal.in/ |
| Twilio WhatsApp | ₹0.80/msg | https://www.twilio.com/ |

---

## 🎯 Quick Commands

**Test messaging:**
```bash
node test_messaging.js
```

**Check logs:**
```bash
# Look for [SMS] or [WhatsApp] in console
```

**Switch provider:**
```env
# In .env file
SMS_PROVIDER=MSG91  # or FAST2SMS or TEXTLOCAL
```

**Disable messaging:**
```env
ENABLE_SMS=false
ENABLE_WHATSAPP=false
```

---

## 📱 Message Preview

**SMS (160 characters max):**
```
Dear Parent, Rahul Kumar reached school at 09:15 AM on 13 Jan. -School
```

**WhatsApp (Unlimited):**
```
✅ Attendance Update

Dear Parent,

Your ward Rahul Kumar has reached school safely at 09:15 AM on 13 Jan, 2026.

- School Administration
```

---

## ❓ Troubleshooting

**No messages sent?**
- Check API key is correct in `.env`
- Check `ENABLE_SMS=true`
- Check phone number format (+91xxxxxxxxxx)
- Run test script to see errors

**Messages not delivered?**
- Check SMS provider balance
- Verify phone number is active
- Check provider dashboard for delivery status

**Wrong provider selected?**
- Check `SMS_PROVIDER` in `.env`
- Must be: FAST2SMS, MSG91, or TEXTLOCAL

---

## 💡 Pro Tips

1. **Buy credits in bulk** - ₹1000 = 10,000 SMS (better rate)
2. **Test with your number first** - Don't spam parents during testing!
3. **Monitor usage** - Check provider dashboard weekly
4. **Keep backup** - Enable both SMS + WhatsApp for critical alerts
5. **Save money** - Use SMS for daily, WhatsApp for important only

---

## 📞 Need Help?

**Fast2SMS Support:**
- Email: support@fast2sms.com
- Website: https://www.fast2sms.com/
- Docs: https://docs.fast2sms.com/

**MSG91 Support:**
- Email: support@msg91.com
- Website: https://msg91.com/
- Docs: https://docs.msg91.com/

---

## ✨ You're Ready!

Total time: **5 minutes**
Total cost: **₹1,000/month** (500 students)
Savings vs WhatsApp: **₹7,000/month**

**Happy messaging! 🎉**
