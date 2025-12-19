const { execSync } = require('child_process');
const fs = require('fs');
const https = require('https');

try {
    console.log("Fetching build URL...");
    const output = execSync('eas build:list --limit 1 --platform android --json --non-interactive', { encoding: 'utf-8' });
    const builds = JSON.parse(output);
    const url = builds[0].artifacts.buildUrl;

    if (!url) {
        throw new Error("No artifact URL found");
    }

    console.log("Downloading from:", url);
    const destPath = 'e:\\SchoolSoftware\\backend\\public\\app.apk';
    const file = fs.createWriteStream(destPath);

    https.get(url, (response) => {
        response.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log("Download Completed to:", destPath);
        });
    }).on('error', (err) => {
        fs.unlink(destPath, () => { }); // Delete the file async
        console.error("Download Error:", err.message);
    });

} catch (error) {
    console.error("Error:", error.message);
}
