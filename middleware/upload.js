const multer = require('multer');

// Configure multer for memory storage (we'll convert to base64)
const storage = multer.memoryStorage();

// File filter to accept all image formats
const fileFilter = (req, file, cb) => {
    // Accept any image format
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Size validation middleware (1KB to 500KB - more flexible)
const validateImageSize = (req, res, next) => {
    if (!req.file) {
        return next();
    }

    const fileSizeInKB = req.file.size / 1024;
    const MIN_SIZE_KB = 1; // Minimum 1KB
    const MAX_SIZE_KB = 500; // Maximum 500KB

    if (fileSizeInKB < MIN_SIZE_KB) {
        return res.status(400).json({
            success: false,
            message: `Image size must be at least ${MIN_SIZE_KB}KB. Current size: ${fileSizeInKB.toFixed(2)}KB`
        });
    }

    if (fileSizeInKB > MAX_SIZE_KB) {
        return res.status(400).json({
            success: false,
            message: `Image size must not exceed ${MAX_SIZE_KB}KB. Current size: ${fileSizeInKB.toFixed(2)}KB. Please compress your image.`
        });
    }

    // Convert to base64
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    req.imageBase64 = base64Image;

    next();
};

// Multer upload configuration
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 512 * 1024 // 512KB hard limit
    }
});

module.exports = {
    upload,
    validateImageSize
};
