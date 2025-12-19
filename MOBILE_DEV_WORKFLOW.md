# 🔄 Mobile App Development Workflow

## Quick Answer to Your Question:
**NO, you don't rebuild from scratch!** But you DO need to rebuild when switching between local and production.

---

## 📱 Two Ways to Work

### Method 1: Current Build (Production - Online)
✅ **Currently building now**
- Works with **mobile data** anywhere
- Connects to: `https://school-software-backend-z86u.onrender.com`
- For: **Real users and final testing**

### Method 2: Local Testing Build
- Works only on **your WiFi**
- Connects to: `http://10.60.101.164:5000`
- For: **Development and testing new features**

---

## 🛠️ How to Switch Between Them

### Step 1: Edit Configuration File
Open: `mobile-app/src/config/api.js`

**For LOCAL testing:**
```javascript
const USE_LOCAL_SERVER = true; // ← Change to true
```

**For PRODUCTION (online):**
```javascript
const USE_LOCAL_SERVER = false; // ← Change to false
```

### Step 2: Rebuild APK
```bash
cd mobile-app

# For local testing
eas build --platform android --profile preview

# For production (online)
eas build --platform android --profile production
```

### Step 3: Install New APK
- Uninstall old app
- Install new APK
- Done!

---

## ⚡ Important Notes

### Do You Rebuild "From Scratch"?
**NO!** EAS uses **smart caching**:
- First build: ~20-25 minutes
- Subsequent builds: ~10-15 minutes (uses cache)
- Only changed files are recompiled

### When Do You Need to Rebuild?
✅ **YES - Rebuild needed:**
- Switching local ↔ production
- Changing UI/design
- Adding new features to mobile app
- Updating dependencies

❌ **NO - Rebuild NOT needed:**
- Backend API changes (database, endpoints)
- Web frontend changes
- Backend bug fixes
- Data updates

### Why Can't We Avoid Rebuilding?
The API URL is **compiled into the app** at build time. React Native bundles everything into native code, so you can't change it after building.

---

## 💡 Best Practice Workflow

### During Development:
1. Keep `USE_LOCAL_SERVER = true`
2. Build ONCE for local testing
3. Test all features on WiFi
4. Make changes to backend/frontend as needed (no rebuild!)

### Before Release:
1. Change `USE_LOCAL_SERVER = false`
2. Build production APK
3. Test with mobile data
4. Distribute to users

### For Updates:
1. Make changes to mobile app code
2. Keep `USE_LOCAL_SERVER = false`
3. Rebuild production APK (~10-15 mins with cache)
4. Users download and install new version

---

## 🚀 Current Build Status

**Currently Building:** Production APK (online backend)
- Started: ~6 minutes ago
- Estimated completion: ~15-20 minutes remaining
- Configuration: `USE_LOCAL_SERVER = false`
- Will work with: Mobile data anywhere

---

## 📝 Summary

**Your Question:** "Do I rebuild from scratch when switching local to online?"

**Answer:** 
- You **rebuild** (not from scratch, uses cache)
- Takes ~10-15 minutes (faster than first build)
- Just change ONE line in `api.js` and run build command
- EAS handles the rest automatically!
