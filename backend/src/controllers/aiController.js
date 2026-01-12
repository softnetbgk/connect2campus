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

        // Use full model path with models/ prefix
        const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash-latest" });

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
        let promptText;

        if (imageParts.length > 0) {
            // Image-based prompt - much more strict
            promptText = `You are an expert academic teacher creating an exam question paper.

CRITICAL INSTRUCTIONS FOR IMAGE-BASED GENERATION:
1. CAREFULLY READ AND ANALYZE the text, diagrams, formulas, and content in the provided image(s)
2. ONLY generate questions about the SPECIFIC topics, concepts, facts, and information visible in the image
3. DO NOT add questions about general knowledge or topics not shown in the image
4. Extract key terms, definitions, formulas, dates, names, and concepts DIRECTLY from the image
5. Questions must test understanding of the EXACT content shown in the image

Paper Specifications:
- Subject: ${subject || 'Based on image content'}
- Class Level: ${classLevel || 'Grade 10'}
- Difficulty: ${difficulty}
- Number of Questions: ${questionCount}
- Question Type: ${type} (If 'mixed', include MCQ, FillInBlanks, MatchTheFollowing, and Descriptive)

OUTPUT FORMAT:
Strictly output a JSON array of objects. Do not include any extra text or explanations.
Each object must have:
- "id": unique number (start from 1)
- "type": "MCQ" | "Descriptive" | "FillInBlanks" | "MatchTheFollowing"
- "question": Question text based ONLY on image content
- "marks": recommended marks
- "answer": The correct answer

Type-Specific Fields:
1. MCQ: "options": ["Option A", "Option B", "Option C", "Option D"], "answer": "Correct option text"
2. FillInBlanks: "question": "Text with ______ for blank", "answer": "Correct word/phrase"
3. MatchTheFollowing: "question": "Match the following", "pairs": [{"left": "Item", "right": "Match"}] (4 pairs), "answer": "Brief summary"

Example JSON:
[
    { "id": 1, "type": "MCQ", "question": "...", "options": ["A", "B", "C", "D"], "marks": 1, "answer": "A" },
    { "id": 2, "type": "Descriptive", "question": "...", "marks": 5, "answer": "..." }
]`;
        } else {
            // Topic-based prompt - original
            promptText = `You are an expert academic teacher. Generate a question paper with the following specifications:
        - Subject: ${subject || 'General'}
        - Class Level: ${classLevel || 'Grade 10'}
        - Topic: ${topic || 'General'}
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
        }

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

        // Check if it's a model not found error
        if (error.message && error.message.includes('404') && error.message.includes('not found')) {
            return res.status(500).json({
                message: "AI Model Not Available. Your Gemini API key may not have access to the required models. Please check:\n1. Your API key is valid and active\n2. You have enabled the Gemini API in Google Cloud Console\n3. Try regenerating your API key\n\nContact your administrator for help.",
                error: "Model not available with current API key"
            });
        }

        res.status(500).json({ message: "Failed to generate questions. " + (error.message || "") });
    }
};

module.exports = { generateQuestions };
