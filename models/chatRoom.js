// models/chatRoom.js
const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  roomId: String,
  createdBy: mongoose.Schema.Types.ObjectId, // reference to Expert or Farmer
  active: { type: Boolean, default: true }
});

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
