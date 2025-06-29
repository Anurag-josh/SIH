// routes/history.js
const express = require('express');
const router = express.Router();
const History = require('../models/historyModel');
const { isloggedin } = require('../middleware.js');

router.get('/', isloggedin, async (req, res) => {
  try {
    const userId = req.user._id;
    const history = await History.find({ user: userId }).sort({ createdAt: -1 });

    res.render('history', { history });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).render('error', { message: 'Could not load history' });
  }
});

module.exports = router;
