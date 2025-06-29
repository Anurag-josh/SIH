const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');
const { isloggedin } = require("../middleware.js");

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

// Render the index page
router.get('/', (req, res) => {
  res.render('index', { showResults: false });
});

// Handle image upload and prediction
router.post('/upload', isloggedin, (req, res) => {
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


    const lang = req.cookies.lang;
    try {
      const formData = new FormData();
      formData.append('image', fs.createReadStream(req.file.path), {
        filename: req.file.originalname,
        contentType: req.file.mimetype
      });

      formData.append('lang', lang || 'en');
      // Pass selected language to Flask

      const flaskResponse = await axios.post('http://localhost:5001/predict', formData, {
        headers: {
          ...formData.getHeaders(),
          'Accept': 'application/json'
        },
        maxContentLength: 25 * 1024 * 1024,
        maxBodyLength: 25 * 1024 * 1024
      });

      // Delete uploaded file after use
      // fs.unlink(req.file.path, (unlinkErr) => {
      //   if (unlinkErr) console.error('Error deleting file:', unlinkErr);
      // });

      const History = require('../models/historyModel'); // Add at top

      // Save to user history
      await History.create({
        user: req.user._id,
        imageUrl: `uploads/${req.file.filename}`, // Store relative path
        prediction: flaskResponse.data.explanation
      });

      res.render('index', {
        explanation: flaskResponse.data.explanation,
        showResults: true,
        originalImage: `/uploads/${req.file.filename}`
      });


    } catch (error) {
      // Delete file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlink(req.file.path, () => { });
      }

      console.error('Flask API Error:', error.response?.data || error.message);
      res.status(500).render('error', {
        message: error.response?.data?.error || 'Failed to process image'
      });
    }
  });
});

module.exports = router;
