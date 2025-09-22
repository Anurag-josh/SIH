const express = require('express');
const router = express.Router();
const { isloggedin } = require("../middleware.js");

// This is the route you need to change
router.get('/', (req, res) => {
  // Check if the user is authenticated (logged in)
  if (req.isAuthenticated()) {
    // If they are logged in, render their profile/dashboard page
    res.render('Profile', { farmerId: req.user._id }); 
  } else {
    // If they are not logged in, render the public landing page
    res.render('landing');
  }
});

router.get('/account', isloggedin, (req, res) => res.send('Account Page')); // Good to protect this route
router.get('/settings', isloggedin, (req, res) => res.send('Settings Page')); // Good to protect this route

module.exports = router;