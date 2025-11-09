const { GoogleGenAI } = require("@google/genai");
const fs = require('fs');
require('dotenv').config();

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

async function uploadAndAskGemini(filePath , prompt) {
    try {
        // Đọc file
        const fileData = fs.readFileSync(filePath);
        const base64Data = fileData.toString('base64');

        // Xác định MIME type dựa vào extension
        let mimeType = 'text/plain';
        if (filePath.endsWith('.pdf')) mimeType = 'application/pdf';
        else if (filePath.endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else if (filePath.endsWith('.txt')) mimeType = 'text/plain';
        else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) mimeType = 'image/jpeg';
        else if (filePath.endsWith('.png')) mimeType = 'image/png';
        else if (filePath.endsWith('.xlsx')) mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        // Gửi file kèm prompt tới Gemini
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: base64Data
                            }
                        },
                        {
                            text: prompt
                        }
                    ]
                }
            ]
        });
        console.log( response.text);
        return response.text;
    } catch (error) {
        console.error('Lỗi:', error.message);
        throw error;
    }
}

module.exports = {
    uploadAndAskGemini
};

