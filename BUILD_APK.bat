@echo off
echo 🔨 Setting up Android Environment...
echo sdk.dir=%LOCALAPPDATA%\Android\Sdk > mobile-app\android\local.properties

echo 🚀 Building APK (This may take 5-10 minutes)...
cd mobile-app\android
call gradlew assembleRelease

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build Failed! Please check if Android SDK is installed.
    pause
    exit /b %ERRORLEVEL%
)

echo ✅ Build Successful!
echo 📦 Moving APK to download location...
copy app\build\outputs\apk\release\app-release.apk ..\..\backend\public\app.apk

echo.
echo 🎉 DONE! You can now download the new APK from the Login Page.
pause
