# 🔍 Troubleshoot "Exited with status 1"

The error "Exited with status 1" is a generic failure message. The **real reason** is printed in the logs just above that line.

## 1. Check the Root Directory (Most Likely Cause)

If you see logs like `npm error enoent Could not read package.json`, it is 100% the Root Directory setting.

1.  Go to **Render Dashboard** -> **Backend Service** -> **Settings**.
2.  Scroll to **"Build & Deploy"**.
3.  Ensure **Root Directory** is set to: `backend`

## 2. Check the Logs

Please look at the deployment logs in Render:
1.  Click on the failed deployment (the one marked "Failed").
2.  Scroll down to the bottom.
3.  Look at the lines **immediately above** "Exited with status 1".

### Common Errors:

**A) "Could not read package.json"**
- **Cause**: Wrong Root Directory.
- **Fix**: Set Root Directory to `backend`.

**B) "sh: 1: nodemon: not found"**
- **Cause**: Running `dev` script in production or missing dependency.
- **Fix**: Ensure Start Command is `node src/server.js` or `npm start`, NOT `npm run dev`.

**C) "Error: Cannot find module..."**
- **Cause**: Missing file or wrong import path.
- **Fix**: Check if you pushed all files (including new migrations).

## 3. Verify Requirements

Ensure your **Backend Settings** in Render match this exactly:

- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start` (or `node src/server.js`)
- **Environment Variables**:
  - `NODE_VERSION`: `18` (Optional, but recommended to match local)
