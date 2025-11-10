const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Store files in uploads directory at project root
        const uploadPath = path.join(__dirname, '../../uploads');
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Giữ nguyên tên file gốc, không chuyển đổi encoding
        let originalName = file.originalname;
        
        const timestamp = Date.now();
        const ext = path.extname(originalName);
        const nameWithoutExt = path.basename(originalName, ext);

        // Thay thế ký tự nguy hiểm nhưng giữ nguyên tiếng Việt
        const safeName = nameWithoutExt.replace(/[\\/:*?"<>|]/g, '_');
        const finalName = `${safeName}-${timestamp}${ext}`;
        cb(null, finalName);
    }
});

// Create multer upload instance
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max file size
        files: 10 // Maximum 10 files
    }
}).any(); // Cho phép upload nhiều file, hoặc không có file cũng không lỗi

// Middleware wrapper để luôn next
const uploadFilesMidWare = (req, res, next) => {
    upload(req, res, function (err) {
        if (err) {
            // Nếu lỗi do multer (quá dung lượng, sai định dạng...) thì trả về lỗi
            return res.status(400).json({ error: err.message });
        }
        // Không có file hoặc có file đều next
        next();
    });
};

module.exports = uploadFilesMidWare;