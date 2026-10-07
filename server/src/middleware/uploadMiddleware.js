const multer = require('multer');

// Configure memory storage
const storage = multer.memoryStorage();

// File filter for PDF only
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB limit
  },
  fileFilter
});

module.exports = upload;
