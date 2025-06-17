const express = require('express');
const app = express();
const path = require('path');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const mongoose = require("mongoose");
const session=require("express-session");
const LocalStrategy = require("passport-local");
const passport=require("passport");
const flash=require('connect-flash');
const indexRoutes = require('./routes/index');
const labRoutes = require('./routes/labs');
const landingRoutes = require('./routes/landing');
const signupRoute= require('./routes/user')
const MongoStore = require('connect-mongo');
const User=require("./models/user.js");


const store = MongoStore.create({
  mongoUrl: "mongodb://127.0.0.1:27017/framfriend", // Your DB URL
  crypto: {
    secret: "mycode", // Optional encryption for session data
  },
  touchAfter: 24 * 3600 // time period in seconds
});

store.on("error",()=>{
  console.log("ERROR in MONGO SESSION STORE",err); 
})

const sessionOptions = {
  store,
  secret: "mycode",
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // cookie expires in 1 week
    maxAge: 7 * 24 * 60 * 60 * 1000,               // maximum cookie age
    httpOnly: true                                 // prevents client-side JS from accessing the cookie
  },
};

const MONGO_URL="mongodb://127.0.0.1:27017/framfriend";

main()
.then(()=>{
    console.log("connected to db");
})
.catch((err)=>{
    console.log(err);
})

async function main(){
    await mongoose.connect(MONGO_URL);
}




// Configure Flask backend URL
const FLASK_BACKEND = 'http://localhost:5001'; // or your Flask server URL

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Add JSON body parser






app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.currUser=req.user;
    next();
});

app.use((req, res, next) => {
  console.log("Is Authenticated:", req.isAuthenticated());
  console.log("Current User:", req.user);
  next();
});




// Routes
app.use('/', landingRoutes);
app.use('/diagnosis', indexRoutes);
app.use('/labs', labRoutes);
app.use('/', signupRoute);




// Error handling middleware
app.use((req, res, next) => {
  res.status(404).render('error', { message: 'Page not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));