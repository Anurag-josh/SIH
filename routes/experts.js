const express = require('express');
const router = express.Router();
const Expert = require('../models/expert');
const Message = require('../models/message');
const ChatRoom = require('../models/chatRoom');

const EXPERT_SECRET_CODE = 'xyz';

router.get('/', async (req, res) => {
 const experts = await Expert.find({ isAvailable: true });
  res.render('ask-expert', { experts });
});

router.post('/register', async (req, res) => {
  const { name, email, code } = req.body;
  if (code !== EXPERT_SECRET_CODE) {
    return res.send('Invalid access code.');
  }
  await Expert.create({ name, email });
  req.session.expertId = (await Expert.findOne({ email }))._id;
  res.redirect(`/experts/chat?id=${req.session.expertId}`);
});

router.post('/login', async (req, res) => {
  const { email, code } = req.body;
  if (code !== EXPERT_SECRET_CODE) {
    return res.send('Invalid access code.');
  }
  const expert = await Expert.findOne({ email });
  if (!expert) {
    return res.send('Expert not found.');
  }
  req.session.expertId = expert._id;
  res.redirect(`/experts/chat?id=${expert._id}`);
});

// In routes/expert.js - modify the chat route
router.get('/chat', async (req, res) => {
  const expertId = req.query.id;
  const roomId = expertId; // or some combination

  // Check or create chat room
  let chatRoom = await ChatRoom.findOne({ roomId });
  if (!chatRoom) {
    chatRoom = await ChatRoom.create({ roomId, createdBy: expertId });
  }

  if (!chatRoom.active) {
    return res.send("This chat room has been closed.");
  }

  // existing logic
  const expert = await Expert.findById(expertId);
  const messages = await Message.find({ expertId }).sort({ timestamp: 1 });
  const currentSender = req.session.expertId || (req.user && req.user._id);

  res.render('expert-chat', { expert, messages, currentSender, roomId });
});


router.post('/chat/end', async (req, res) => {
  const expertId = req.session.expertId;

  if (!expertId) {
    return res.status(403).send('Unauthorized');
  }

  await Expert.findByIdAndUpdate(expertId, { isAvailable: false });

  req.session.expertId = null; // optional: end session
  res.redirect('/experts'); // or show "chat ended" page
});


// In routes/expert.js - modify the send route
router.post('/chat/send', async (req, res) => {
  const { expertId, content } = req.body;
  const isExpert = req.session.expertId === expertId;
  const sender = isExpert ? 'expert' : 'user';
  
  await Message.create({ 
    expertId, 
    sender, 
    content,
    timestamp: new Date()
  });
  
  res.redirect(`/experts/chat?id=${expertId}`);
});

router.get('/logout', (req, res) => {
  req.session.expertId = null;
  res.redirect('/experts');
});

module.exports = router;

