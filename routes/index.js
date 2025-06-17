const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');
const { isloggedin }=require("../middleware.js");

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Images only!');
    }
  }
}).single('leafImage');

router.get('/', (req, res) => {
  res.render('index', { showResults: false });
});

router.post('/upload',isloggedin,(req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).render('error', { 
        message: err instanceof multer.MulterError 
          ? 'File too large (max 25MB)' 
          : 'Only images are allowed'
      });
    }

    if (!req.file) {
      return res.status(400).render('error', { message: 'No file selected' });
    }

    try {
      const formData = new FormData();
      formData.append('image', fs.createReadStream(req.file.path), {
        filename: req.file.originalname,
        contentType: req.file.mimetype
      });

      const flaskResponse = await axios.post('http://localhost:5001/predict', formData, {
        headers: {
          ...formData.getHeaders(),
          'Accept': 'application/json'
        },
        maxContentLength: 25 * 1024 * 1024,
        maxBodyLength: 25 * 1024 * 1024
      });

      // Clean up file
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting file:', unlinkErr);
      });

      res.render('index', {
        explanation: flaskResponse.data.explanation,
        showResults: true,
        originalImage: `/uploads/${req.file.filename}`
      });

    } catch (error) {
      // Clean up file if error occurred
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlink(req.file.path, () => {});
      }

      console.error('Flask API Error:', error.response?.data || error.message);
      res.status(500).render('error', {
        message: error.response?.data?.error || 'Failed to process image'
      });
    }
  });
});

module.exports = router;