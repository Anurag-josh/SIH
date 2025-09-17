const express = require('express');
const router = express.Router();
const Expert = require('../models/expert');
const Message = require('../models/message');
const ChatRoom = require('../models/chatRoom');
const User = require('../models/user');

const EXPERT_SECRET_CODE = 'xyz';

// Route to display all available experts
router.get('/', async (req, res) => {
    const experts = await Expert.find({ isAvailable: true });
    res.render('ask-expert', { experts });
});

// Expert registration route
router.post('/register', async (req, res) => {
    const { name, email, code } = req.body;
    if (code !== EXPERT_SECRET_CODE) {
        return res.send('Invalid access code.');
    }
    await Expert.create({ name, email });
    const expert = await Expert.findOne({ email });
    req.session.expertId = expert._id;
    res.redirect("/experts/dashboard");
});

// Expert dashboard route with auth check
router.get("/dashboard", async (req, res) => {
    const expertId = req.session.expertId;

    if (!expertId) {
        return res.redirect('/experts');
    }

    const recentDoubts = await Message.aggregate([
        { $match: { receiverId: expertId } },
        {
            $group: {
                _id: "$senderId",
                lastMessage: { $last: "$$ROOT" }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "farmer"
            }
        },
        { $unwind: "$farmer" }
    ]);

    res.render("expert-dashboard", { doubts: recentDoubts, expertId: expertId.toString() });
});

// Expert login route
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

// Chat route for both experts and users
router.get('/chat', async (req, res) => {
    const expertId = req.query.id;
    const farmerId = req.query.farmerId || (req.user && req.user._id);
    const roomId = `${expertId}_${farmerId}`;

    let chatRoom = await ChatRoom.findOne({ roomId });
    if (!chatRoom) {
        chatRoom = await ChatRoom.create({ roomId, expertId, farmerId, active: true });
    }

    if (!chatRoom.active) {
        return res.send("This chat room has been closed.");
    }

    const expert = await Expert.findById(expertId);
    const messages = await Message.find({ roomId }).sort({ timestamp: 1 });
    const currentSender = req.session.expertId || (req.user && req.user._id);

    // Fetch and pass the current user's/expert's name to the template
    let currUser = null;
    if (req.user) {
        currUser = req.user; // It's a farmer, req.user already has name
    } else if (req.session.expertId) {
        currUser = await Expert.findById(req.session.expertId); // Fetch expert's info
    }

    res.render('expert-chat', { expert, messages, currentSender, roomId, currUser });
});

// Route to send messages
router.post('/chat/send', async (req, res) => {
    const { roomId, content, senderId, receiverId, senderType } = req.body;

    if (!senderId) return res.status(403).send("Not authorized");

    await Message.create({
        roomId,
        senderId,
        receiverId,
        content,
        senderType,
        timestamp: new Date()
    });

    res.redirect(`/experts/chat?id=${receiverId}&farmerId=${senderId}`);
});

// Route to end the chat
router.post('/chat/end', async (req, res) => {
    const { roomId } = req.body;
    const expertId = req.session.expertId;

    const chatRoom = await ChatRoom.findOne({ roomId, expertId });
    if (chatRoom) {
        chatRoom.active = false;
        await chatRoom.save();
        req.app.get('io').to(roomId).emit('chatEnded');
        res.status(200).send('Chat ended successfully.');
    } else {
        res.status(403).send('Not authorized to end this chat.');
    }
});

// Expert logout route
router.get('/logout', (req, res) => {
    req.session.expertId = null;
    res.redirect('/experts');
});

module.exports = router;