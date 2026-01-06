const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Ensure upload directories exist
const ensureDirectories = async () => {
  const dirs = [
    path.join(__dirname, '../uploads/certificates'),
    path.join(__dirname, '../uploads/signatures'),
    path.join(__dirname, '../uploads/course-materials')
  ];
  
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      console.error(`Error creating directory ${dir}:`, error);
    }
  }
};

ensureDirectories();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = path.join(__dirname, '../uploads');
    
    if (file.fieldname === 'signature') {
      uploadPath = path.join(uploadPath, 'signatures');
    } else if (file.fieldname === 'certificateTemplate') {
      uploadPath = path.join(uploadPath, 'certificates');
    } else {
      uploadPath = path.join(uploadPath, 'course-materials');
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow PDFs and images
  if (file.mimetype === 'application/pdf' || 
      file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: fileFilter
});

module.exports = upload;

