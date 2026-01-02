const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
require("dotenv").config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No GEMINI_API_KEY found in environment variables.");
        return;
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        let output = "Available Models:\n";
        if (data.models) {
            data.models.forEach(m => output += `- ${m.name}\n`);
        } else {
            output += "No models found.\n";
        }
        fs.writeFileSync('models_list.txt', output);
        console.log("Check models_list.txt");
    } catch (error) {
        console.error("Error fetching models:", error);
        fs.writeFileSync('models_list_error.txt', error.toString());
    }
}

listModels();
