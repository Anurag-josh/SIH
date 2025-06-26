const express = require('express');
const router = express.Router();
const { isloggedin }=require("../middleware.js");

router.get('/', (req, res) => {
  res.render('landing'); // views/landing.ejs
});

router.get('/account', (req, res) => res.send('Account Page'));
router.get('/settings', (req, res) => res.send('Settings Page'));
router.get('/history', (req, res) => res.send('History Page'));


module.exports = router;
