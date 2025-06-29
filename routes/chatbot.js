// 📁 routes/chatbot.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

const upload = multer({ dest: 'uploads/' });

// Chatbot page
router.get('/', (req, res) => {
  res.render('chatbot');
});

// Send message and optional file
router.post('/ask', upload.single('file'), async (req, res) => {
  try {
    const userMessage = req.body.prompt;
    const file = req.file;

    const formData = new FormData();
    formData.append('prompt', userMessage);

    if (file) {
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.pdf') {
        formData.append('file', fs.createReadStream(file.path), file.originalname);
      }
    }

    const response = await axios.post('http://localhost:5001/file-chat', formData, {
      headers: formData.getHeaders(),
    });

    if (file) fs.unlinkSync(file.path);
    res.json({ reply: response.data.reply });
  } catch (err) {
    console.error('Chatbot error:', err.message);
    res.status(500).json({ reply: 'Server error while processing your request.' });
  }
});

module.exports = router;
