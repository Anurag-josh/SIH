const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  expertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expert',
    required: true
  },
  sender: {
    type: String, // 'user' or 'expert'
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  image: {
    type: String, // file path or URL if image sent
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Message', messageSchema);
