const { uploadAndAskGemini } = require('../services/geminiService')

async function splitTestResult(req, res) {

    // lấy ra danh mục các file đã upload
    const uploadedFiles = req.files;
    if (!uploadedFiles || uploadedFiles.length === 0) {
        return res.status(400).json({ error: 'No files were uploaded.' });
    }

    // xử lý từng file 1
    const results = [];
    const prompt = "Trả về ONLY JSON, Trả kết quả dạng mảng, không có markdown, không có text khác. Format: [{\"name\": \"\", \"lotNumber\": \"\" , \"page\": \"\"}]. Dữ liệu: Tên mẫu và số lô và số trang của trang pdf.";
    try {
    for (const file of uploadedFiles) {
        const filePath = file.path;
          const response = await uploadAndAskGemini(filePath, prompt);
        // Loại bỏ markdown code blocks và ký tự thừa
        let cleanedResponse = response
            .replace(/```json\n?/g, '')  // Xóa ```json
            .replace(/```\n?/g, '')       // Xóa ```
            .trim();                       // Xóa khoảng trắng đầu cuối
        // Chuyển thành object JSON
        let jsonData;
        try {
            jsonData = JSON.parse(cleanedResponse);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            jsonData = { error: 'Failed to parse JSON from Gemini response.' };
        }
        results.push({
            fileName: file.filename,
            data: jsonData
        });
    }
    res.json({ results });
    } catch (error) {
        console.error('Error in splitTestResult:', error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
}

module.exports = {
    splitTestResult,
};