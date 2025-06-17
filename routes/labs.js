const express = require('express');
const router = express.Router();
const { isloggedin }=require("../middleware.js");

router.get('/', isloggedin,(req, res) => {
  res.render('labs'); // views/labs.ejs
});

module.exports = router;
