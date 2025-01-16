// routes/userRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const { UserUploadService } = require('../userUpload');
const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, 'users' + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept only csv files
    if (path.extname(file.originalname) !== '.csv') {
      return cb(new Error('Only CSV files are allowed!'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 1024 * 1024 * 5 // 5MB limit
  }
});

// Bulk upload route
router.post('/bulk-upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userService = new UserUploadService();
    console.log("here comes the file path", req.file.path)
    const results = await userService.bulkUploadUsers(req.file.path);

    // Clean up - delete the file after processing
    // require('fs').unlinkSync(req.file.path);

    res.json({
      message: 'Upload completed',
      results
    });
  } catch (error) {
    console.error('Upload failed:', error);
    res.status(500).json({
      error: 'Upload failed',
      details: error.message
    });
  }
});

// Get upload status route (optional)
router.get('/upload-status/:uploadId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('upload_logs')
      .select('*')
      .eq('upload_id', req.params.uploadId)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;