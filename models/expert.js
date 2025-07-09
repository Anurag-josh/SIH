const mongoose = require('mongoose');

const expertSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  // Optional fields you may add later:
  // specialization: String,
  email: String,
  isAvailable: { type: Boolean, default: true },
});

module.exports = mongoose.model('Expert', expertSchema);
