const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');
const User=require("../models/user.js");
const passport=require("passport");
const LocalStrategy = require("passport-local");
const session=require("express-session");
const { isloggedin }=require("../middleware.js");
const { route } = require('./index.js');
const { saveRedirectUrl } = require("../middleware.js");




router.get('/signup', (req, res) => {
    res.render('signup');
});
router.post("/signup",async(req,res,next)=>{
    try{
        let{username,email,password}=req.body;
        const newuser=new User({username,email});
        const registereduser=await User.register(newuser,password);
        // console.log(registereduser);
         req.login(registereduser,(err)=>{
         if(err){
            return next(err);
         }
         req.flash("success","welcome to GardenGenius");
        res.redirect("/");
        });
    }catch(e){
        req.flash("error",e.message);
        res.redirect("/signup");
    }

})

router.get('/login', (req, res) => {
    res.render('login');
});

router.post("/login", saveRedirectUrl,passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
}), async(req, res) => {
    req.flash("success", "Welcome back to Ezsaty, you are logged in");
    const redirectUrl = res.locals.redirectUrl || "/";

    delete req.session.redirectUrl;
    res.redirect(redirectUrl);
});

router.get("/logout",(req,res,next)=>{
    req.logOut((err)=>{
        if(err){
           return next(err);
        }
        req.flash("success","you are successfully logged out");
        res.redirect("/");
     })
})



module.exports = router;