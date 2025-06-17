const express = require('express');
const router = express.Router();
const { isloggedin }=require("../middleware.js");

router.get('/', (req, res) => {
  res.render('landing'); // views/landing.ejs
});

module.exports = router;
