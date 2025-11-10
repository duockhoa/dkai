const { GoogleGenAI } = require("@google/genai");
const fs = require('fs');
require('dotenv').config();

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

// Hàm helper để delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Hàm retry với exponential backoff
async function retryWithBackoff(fn, maxRetries = 10, initialDelay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            console.error(`Lần thử ${attempt}/${maxRetries} thất bại:`, error.message);
            
            // Nếu đã hết số lần retry thì throw error
            if (attempt === maxRetries) {
                break;
            }
            
            // Tính thời gian delay theo exponential backoff
            const delayTime = initialDelay * Math.pow(2, attempt - 1);
            console.log(`Đợi ${delayTime}ms trước khi thử lại...`);
            await delay(delayTime);
        }
    }
    
    throw new Error(`Đã thử ${maxRetries} lần nhưng vẫn thất bại: ${lastError.message}`);
}

async function uploadAndAskGemini(filePath, prompt, maxRetries = 10) {
    return retryWithBackoff(async () => {
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
            console.log(response.text);
            return response.text;
        } catch (error) {
            console.error('Lỗi khi gọi Gemini API:', error.message);
            throw error;
        }
    }, maxRetries);
}

module.exports = {
    uploadAndAskGemini
};

