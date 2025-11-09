const { uploadAndAskGemini } = require('../services/geminiService')


async function testGemini(req, res) {
    const  filePath = "./uploads/a.pdf";
    const prompt = "Trả về ONLY JSON, không có markdown, không có text khác. Format: {\"productName\": \"\", \"lotNumber\": \"\"}. Dữ liệu: Tên sản phẩm và số lô sản xuất.";
    try {
        const response = await uploadAndAskGemini(filePath, prompt);
        
        // Loại bỏ markdown code blocks và ký tự thừa
        let cleanedResponse = response
            .replace(/```json\n?/g, '')  // Xóa ```json
            .replace(/```\n?/g, '')       // Xóa ```
            .trim();                       // Xóa khoảng trắng đầu cuối
        
        // Parse và format lại JSON để đảm bảo đúng cấu trúc
        try {
            const jsonData = JSON.parse(cleanedResponse);
            res.status(200).json(jsonData);  // Dùng .json() thay vì .send()
        } catch (parseError) {
            // Nếu parse lỗi, trả về raw text đã cleaned
            console.error('JSON parse error:', parseError);
            res.status(200).send(cleanedResponse);
        }
        
    } catch (error) {
        console.error('Error in testGemini:', error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
}

module.exports = {
    testGemini,
};