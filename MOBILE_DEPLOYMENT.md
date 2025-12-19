# 📱 Mobile App Deployment Guide

This guide explains how to update your mobile app when you are ready to go **Live Online** (so it works on mobile data/anywhere).

## 1️⃣ Update API Configuration
When your backend is deployed (e.g., to Render), you will get a URL like `https://school-backend.onrender.com`.

1. Open `mobile-app/src/config/api.js`.
2. Update the `BASE_URL`:

```javascript
export const API_CONFIG = {
    // CHANGE THIS to your online backend URL
    BASE_URL: 'https://your-school-backend.onrender.com/api', 
    TIMEOUT: 30000,
};
```

## 2️⃣ Build the APK (Cloud Build)
We use EAS (Expo Application Services) to build the app in the cloud. This requires no Android Studio installation.

1. Open a terminal in `e:\SchoolSoftware`.
2. Run the build command:
   ```bash
   cd mobile-app
   eas build --platform android --profile preview
   ```
3. Wait for the build to finish (10-15 mins).
4. **Download** the APK file from the link provided in the terminal.

## 3️⃣ Host the New APK
To make the "Download App" button on your login page work with the new file:

1. Rename the downloaded file to `app.apk`.
2. Replace the file at:
   `e:\SchoolSoftware\backend\public\app.apk`
3. If your backend is deployed, you will need to commit and push this new file to GitHub so it updates on the server.

## ✅ Result
- Users can go to your website login page.
- Scan the QR code.
- Download the app.
- **It will work on Mobile Data and WiFi anywhere!**
