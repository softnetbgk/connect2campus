# 🛑 Fix: Re-Create Render Service (The "Nuclear" Option)

Since the "Git Clone" error persists despite retrying, the connection between that specific Render Service and GitHub is likely corrupted.

**The fastest fix is to simply delete the broken service and create a new one.**

## ⚡ Steps to Re-Create (Takes 2 minutes)

1.  **Delete Broken Service**
    - Go to Render Dashboard -> Select the Backend Service.
    - Go to **Settings** -> Scroll to bottom -> **Delete Web Service**.
    - Confirm deletion.

2.  **Create New Service**
    - Click **"New +"** -> **Web Service**.
    - Select **"Build and deploy from a Git repository"**.
    - Connect your `school-software` repository.

3.  **Configure CORRECTLY (Important!)**
    - **Name**: `school-backend` (or similar)
    - **Region**: `Singapore` (or your preference)
    - **Branch**: `main`
    - **Root Directory**: `backend`  <-- **CRITICAL!!**
    - **Runtime**: `Node`
    - **Build Command**: `npm install`
    - **Start Command**: `npm start` (or `node src/server.js`)

4.  **Add Environment Variables**
    - Copy them from your local `.env` file or previous service:
    - `DATABASE_URL`: (Your detailed PostgreSQL URL)
    - `JWT_SECRET`: (Your secret)
    - `NODE_VERSION`: `18` (Optional)

5.  **Click "Create Web Service"**

## 🎯 Why this works?
This forces Render to:
1.  Re-authenticate with GitHub from scratch.
2.  Perform a completely fresh clone of the repository.
3.  Apply the correct "Root Directory" setting from the very beginning.

Use this method to save time! 🚀
