const fs = require('fs');
const path = require('path');

const mode = process.argv[2]; // 'test' or 'prod'

if (!['test', 'prod'].includes(mode)) {
    console.error('Usage: node switch-config.js [test|prod]');
    process.exit(1);
}

const config = {
    test: {
        appId: "com.school.app.test",
        appName: "SchoolApp Test"
    },
    prod: {
        appId: "com.school.app",
        appName: "SchoolApp"
    }
};

const baseConfigPath = path.join(__dirname, 'capacitor.config.json');
let baseConfig = JSON.parse(fs.readFileSync(baseConfigPath, 'utf8'));

baseConfig.appId = config[mode].appId;
baseConfig.appName = config[mode].appName;

fs.writeFileSync(baseConfigPath, JSON.stringify(baseConfig, null, 2));

console.log(`✅ Switched Capacitor config to: ${mode.toUpperCase()} (${baseConfig.appId})`);
console.log(`⚠️  Next: Run 'npx cap sync android' and rebuild in Android Studio.`);
