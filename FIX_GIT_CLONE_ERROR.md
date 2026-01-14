# 🔧 Fix Render "Git Clone" Error

The error `fatal: could not read Username...` means Render **lost permission** to access your GitHub repository.

This happens when:
1.  The GitHub authorization token expired.
2.  The repository permissions changed (e.g., Private vs Public).
3.  Render is trying to access a sub-module it can't reach.

## 🚀 Solution 1: Re-Connect GitHub (Easiest)

1.  Go to your **Render Dashboard**.
2.  Detailed View of your **Backend Service**.
3.  Click **Settings**.
4.  Scroll to **Repository** (near the top).
5.  Click **Edit** (pencil icon) next to the Repository URL.
6.  **Re-select the repository**:
    - Click "GitHub" and select `school-software` again.
    - This refreshes the access token.
7.  **Click Save**.

## 🚀 Solution 2: Clear Build Cache

Sometimes a corrupted git fetch is stuck in the cache.
1.  Click **Manual Deploy** (top right).
2.  Select **"Clear build cache & deploy"**.

---

## ⚠️ Important Reminder: Root Directory

Once the "Git Clone" error is fixed, you might see the "package.json missing" error again if you haven't set the Root Directory.

**Ensure this setting is correct:**
- **Settings** -> **Build & Deploy** -> **Root Directory**
- Set to: `backend`

## 🏁 Summary Checklist

1. [ ] Re-connect repository in Settings to fix Git Authorization.
2. [ ] Set Root Directory to `backend`.
3. [ ] Manual Deploy -> Clear Cache.
