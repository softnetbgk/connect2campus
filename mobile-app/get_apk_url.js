const { execSync } = require('child_process');

try {
    const output = execSync('eas build:list --limit 1 --platform android --json --non-interactive', { encoding: 'utf-8' });
    const builds = JSON.parse(output);
    if (builds && builds.length > 0 && builds[0].artifacts && builds[0].artifacts.buildUrl) {
        console.log("APK_URL:" + builds[0].artifacts.buildUrl);
    } else {
        console.log("No APK URL found.");
        console.log(JSON.stringify(builds[0], null, 2));
    }
} catch (error) {
    console.error("Error:", error.message);
}
