# 🛠 Fix Render Deployment Error

The error `npm error enoent Could not read package.json` happens because Render is looking for `package.json` in the wrong folder.

Since your backend code is in the `backend/` folder (not the root), you need to tell Render where to look.

## 🚀 Steps to Fix

1.  **Go to Render Dashboard**
    - Open your **Backend** Web Service.

2.  **Open Settings**
    - Click on the **"Settings"** tab.

3.  **Update "Root Directory"**
    - Scroll down to the **"Build & Deploy"** section.
    - Find the **"Root Directory"** field.
    - Change it to: `backend`
    - *(It creates a "lock" icon next to it usually)*

4.  **Verify Commands**
    - **Build Command**: `npm install`
    - **Start Command**: `npm start` (or `node src/server.js`)

5.  **Clear Cache & Redeploy**
    - Scroll up to the top right.
    - Click **"Manual Deploy"**.
    - Select **"Clear build cache & deploy"**.

## 📝 Why this happens?
By default, Render tries to run `npm install` in the main folder of your repository. But your project structure is:
```
/
  backend/   <-- Your package.json is here!
  frontend/
```
Setting "Root Directory" to `backend` tells Render to go into that folder before running commands.

---

## 🛑 Additional Check: Node Version
The log shows: `Using Node.js version 22.16.0`.
Your `backend/package.json` asks for: `"engines": { "node": "18" }`.
This is usually fine, but if you want to force Node 18:
1.  In Render Settings, scroll to **"Environment Variables"**.
2.  Add a new variable:
    - Key: `NODE_VERSION`
    - Value: `18.19.0` (or just `18`)
