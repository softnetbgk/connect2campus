# 🗺️ Master Execution Plan (To Be Executed Later)

This is the definitive roadmap. We will follow these steps sequentially when you are ready to start coding.

## 🎯 Goal
One single, perfect build that includes:
1.  **Password Reset** (Email-based)
2.  **Firebase Infrastructure** (Hosting + Notifications)
3.  **All Native Features** (Push, Camera, Location, Storage) pre-baked into the binary.
4.  **Optimized Size** (20-30MB)

---

## 🛠️ Phase 1: Backend Infrastructure (No App Rebuilds Needed)
*We do this first because the mobile app relies on these APIs existing.*

1.  **Database Updates**
    *   Add `reset_token`, `reset_expiry`, and `fcm_token` columns to Users table.
    *   Create a `notifications` table for history (optional but recommended).

2.  **Email System (Password Reset)**
    *   Install `nodemailer`.
    *   Configure SMTP (using Brevo/Gmail).
    *   Create `/api/auth/forgot-password` endpoint.
    *   Create `/api/auth/reset-password` endpoint.

3.  **Push Notification Backend System**
    *   Setup `firebase-admin` SDK in Backend.
    *   Create a generic `notifyUser(userId, title, body)` function.
    *   **Implement Triggers** (Hook into existing controllers):
        *   `markAttendance` -> Triggers "Attendance Update"
        *   `updateMarks` -> Triggers "Results Out"
        *   `processSalary` -> Triggers "Salary Credited"
        *   `updateLeaveStatus` -> Triggers "Leave Approved/Rejected"
        *   `resolveDoubt` -> Triggers "Doubt Cleared"
        *   `createEvent` -> Triggers "New Event"
        *   `updateFees` -> Triggers "Fee Update"
        *   `startTracking` -> Triggers "Bus Started"

---

## 📱 Phase 2: Mobile/Frontend Preparation (The "One-Shot" Build)
*Crucial: We install ALL native plugins now so we don't have to rebuild the APK later.*

1.  **Install Capacitor Plugins**
    *   `@capacitor/push-notifications` (Crucial)
    *   `@capacitor/camera` (For doubts/profile pics)
    *   `@capacitor/geolocation` (For driver tracking)
    *   `@capacitor/filesystem` (For downloading reports)
    *   `@capacitor/splash-screen` (For fast loading fix)
    *   `@capacitor/app` (App state handling)

2.  **Configure Native Permissions (`AndroidManifest.xml`)**
    *   Add `<uses-permission>` for: Camera, Location (Fine/Coarse), Storage (Read/Write), Audio, Internet.
    *   *Why now?* Because changing permissions later requires a new APK download. Doing it now prevents that.

3.  **Fix "Render Loading" / Startup Speed**
    *   Modify `capacitor.config.json` to hide splash screen automatically or via code.
    *   Update `App.jsx` to render the Login/Welcome screen immediately, skipping the "Loading..." text.

4.  **Implement Frontend Features**
    *   **Forgot Password Screen**: Add API call to trigger backend email.
    *   **Notification Listener**: Add code in `App.jsx` to listen for incoming push messages and show alerts/badges.

---

## 🔥 Phase 3: Migration to Firebase
1.  **Frontend Build**
    *   Run `npm run build` to create the `dist` folder.
2.  **Firebase Init**
    *   Run `firebase init` in the root.
    *   Select **Hosting**.
    *   Point to `frontend/dist` (or wherever the build output is).
3.  **Update Config**
    *   Change `capacitor.config.json` `server.url` to the new Firebase URL (e.g., `https://your-school-app.web.app`).

---

## 📦 Phase 4: Final Build & Optimization (The "Release")
1.  **Size Optimization (Target: <30MB)**
    *   Compress all static assets (images/icons) in `public/`.
    *   Enable "minify" and "shrinkResources" in `android/app/build.gradle`.
2.  **Generate APK**
    *   Open Android Studio.
    *   Build > Generate Signed Bundle/APK.
    *   Create a release Keystore (save this securely!).
3.  **Distribution**
    *   Upload the final APK to your Git repository (Releases section).
    *   Share the link.

---

## ⚠️ Checklist Before We Start Coding (Next Session)
*   [ ] Do you have the SMTP (Email) credentials ready?
*   [ ] Do you have the Firebase Console access ready?
*   [ ] Is your Android Studio installed and updated?

**Status**: Plan is Locked. Ready to execute Phase 1 when you say "Start".
