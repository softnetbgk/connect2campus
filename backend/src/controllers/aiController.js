const { GoogleGenerativeAI } = require("@google/generative-ai");

// Helper: Format AI response into clean JSON
const cleanAIResponse = (text) => {
    try {
        console.log("--- Raw AI Response ---");
        console.log(text);
        console.log("-----------------------");

        // Remove Markdown code blocks
        let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();

        // Find the first '[' and last ']' to extract just the array
        const firstBracket = clean.indexOf('[');
        const lastBracket = clean.lastIndexOf(']');

        if (firstBracket !== -1 && lastBracket !== -1) {
            clean = clean.substring(firstBracket, lastBracket + 1);
        }

        return JSON.parse(clean);
    } catch (e) {
        console.error("AI JSON Parse Error:", e);
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
        // Use Gemini Flash Latest (Stable and supports Multimodal)
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        // Prepare Image Parts if files exist
        let imageParts = [];
        if (req.files && req.files.length > 0) {
            imageParts = req.files.map(file => ({
                inlineData: {
                    data: file.buffer.toString("base64"),
                    mimeType: file.mimetype,
                },
            }));
        }

        // Construct Prompt
        const promptText = `You are an expert academic teacher. Generate a question paper with the following specifications:
        - Subject: ${subject || 'General'}
        - Class Level: ${classLevel || 'Grade 10'}
        - Topic: ${topic || (imageParts.length > 0 ? 'Based strictly on the provided image content' : 'General')}
        - Difficulty: ${difficulty}
        - Number of Questions: ${questionCount}
        - Question Type: ${type} (If 'mixed', include MCQ, FillInBlanks, MatchTheFollowing, and Descriptive. If specifically requested, strictly follow that type.)

        Strictly output a JSON array of objects. Do not include any extra text.
        Each object should have:
        - "id": a unique number (start from 1)
        - "type": "MCQ" | "Descriptive" | "FillInBlanks" | "MatchTheFollowing"
        - "question": The question text
        - "marks": recommended marks
        - "answer": The correct answer (for Teacher's reference)
        
        Specific Fields per Type:
        1. MCQ:
           - "options": ["A", "B", "C", "D"]
           - "answer": "Option Text"
        2. FillInBlanks:
           - "question": "The capital of France is ______." (Use underscores for blank)
           - "answer": "Paris"
        3. MatchTheFollowing:
           - "question": "Match the following items correctly"
           - "pairs": [ {"left": "Item A", "right": "Match A"}, {"left": "Item B", "right": "Match B"} ] (Provide 4 pairs)
           - "answer": "A-1, B-2..." (Brief summary of matches)

        Example JSON format:
        [
            { "id": 1, "type": "MCQ", "question": "...", "options": ["A", "B", "C", "D"], "marks": 1, "answer": "A" },
            { "id": 2, "type": "FillInBlanks", "question": "The sun rises in the ______.", "marks": 1, "answer": "East" },
            { "id": 3, "type": "MatchTheFollowing", "question": "Match the following", "pairs": [{"left":"A","right":"B"}], "marks": 4, "answer": "A-B..." }
        ]`;

        // Send Prompt + Images to Gemini
        const result = await model.generateContent([promptText, ...imageParts]);
        const response = await result.response;
        const text = response.text();

        const questions = cleanAIResponse(text);

        if (!questions) {
            return res.status(500).json({ message: "AI generated invalid format. Check console logs." });
        }

        res.json({ questions });

    } catch (error) {
        console.error("AI Generation Error:", error);
        res.status(500).json({ message: "Failed to generate questions. " + (error.message || "") });
    }
};

module.exports = { generateQuestions };
