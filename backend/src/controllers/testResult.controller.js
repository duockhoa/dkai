const { uploadAndAskGemini } = require('../services/geminiService');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

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
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();
            
            // Chuyển thành object JSON
            let jsonData;
            try {
                jsonData = JSON.parse(cleanedResponse);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                jsonData = { error: 'Failed to parse JSON from Gemini response.' };
            }

            // Tách PDF thành các file nhỏ
            if (Array.isArray(jsonData)) {
                await splitPdfByPages(filePath, jsonData);
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

async function splitPdfByPages(pdfPath, pageData) {
    try {
        // Tạo thư mục outputs nếu chưa có
        const outputDir = path.join(__dirname, '../../outputs');
        await fs.mkdir(outputDir, { recursive: true });

        // Đọc file PDF gốc
        const pdfBytes = await fs.readFile(pdfPath);
        const pdfDoc = await PDFDocument.load(pdfBytes);

        // Tách từng trang theo dữ liệu
        for (const item of pageData) {
            const { name, lotNumber, page } = item;
            
            // Bỏ qua nếu thiếu thông tin
            if (!name || !lotNumber || !page) {
                console.warn('Thiếu thông tin:', item);
                continue;
            }

            // Tạo PDF mới với 1 trang
            const newPdf = await PDFDocument.create();
            
            // Copy trang từ PDF gốc (page bắt đầu từ 1, index bắt đầu từ 0)
            const pageIndex = page - 1;
            if (pageIndex >= 0 && pageIndex < pdfDoc.getPageCount()) {
                const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageIndex]);
                newPdf.addPage(copiedPage);

                // Tạo tên file: Tên + số lô
                const safeFileName = `${name} ${lotNumber}`.replace(/[\\/:*?"<>|]/g, '_');
                const outputPath = path.join(outputDir, `${safeFileName}.pdf`);

                // Lưu file
                const newPdfBytes = await newPdf.save();
                await fs.writeFile(outputPath, newPdfBytes);
                
                console.log(`Đã tách: ${safeFileName}.pdf`);
            } else {
                console.warn(`Trang ${page} không tồn tại trong PDF`);
            }
        }

        console.log('Hoàn thành tách PDF');
    } catch (error) {
        console.error('Lỗi khi tách PDF:', error);
        throw error;
    }
}

module.exports = {
    splitTestResult,
};