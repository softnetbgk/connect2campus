const { GoogleGenerativeAI } = require("@google/generative-ai");

// Helper: Format AI response into clean JSON
// Gemini sometimes wraps JSON in ```json ... ``` blocks
const cleanAIResponse = (text) => {
    try {
        let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(clean);
    } catch (e) {
        console.error("AI JSON Parse Error:", e);
        console.error("Raw Text:", text);
        return null;
    }
};

const generateQuestions = async (req, res) => {
    try {
        const { topic, subject, classLevel, difficulty, questionCount, type, apiKey } = req.body;

        // Use API Key from Request (if user provides own) or Environment Variable
        const keyToUse = apiKey || process.env.GEMINI_API_KEY;

        if (!keyToUse) {
            return res.status(400).json({
                message: "No AI API Key provided. Please set GEMINI_API_KEY in backend or provide one in the request.",
                missingKey: true
            });
        }

        const genAI = new GoogleGenerativeAI(keyToUse);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Construct a strict Prompt
        const prompt = `You are an expert academic teacher. Generate a question paper with the following specifications:
        - Subject: ${subject || 'General'}
        - Class Level: ${classLevel || 'Grade 10'}
        - Topic: ${topic}
        - Difficulty: ${difficulty}
        - Number of Questions: ${questionCount}
        - Question Type: ${type} (If 'mixed', include both MCQ and Descriptive)

        Strictly output a JSON array of objects. Do not include any extra text.
        Each object should have:
        - "id": a unique number (start from 1)
        - "question": The question text
        - "type": "MCQ" or "Descriptive"
        - "marks": recommended marks (e.g., 1 for MCQ, 5 for Descriptive)
        - "options": (Array of strings) Only required for MCQ. Provide 4 options.
        - "answer": The correct answer (for Teacher's reference)

        Example JSON format:
        [
            { "id": 1, "type": "MCQ", "question": "...", "options": ["A", "B", "C", "D"], "marks": 1, "answer": "A" },
            { "id": 2, "type": "Descriptive", "question": "...", "marks": 5, "answer": "Key points..." }
        ]`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const questions = cleanAIResponse(text);

        if (!questions) {
            return res.status(500).json({ message: "AI generated invalid format. Please try again." });
        }

        res.json({ questions });

    } catch (error) {
        console.error("AI Generation Error:", error);
        res.status(500).json({ message: "Failed to generate questions. " + (error.message || "") });
    }
};

module.exports = { generateQuestions };
