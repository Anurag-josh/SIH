const express = require('express');
const app = express();
const path = require('path');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const mongoose = require("mongoose");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const passport = require("passport");
const flash = require('connect-flash');
const indexRoutes = require('./routes/index');
const labRoutes = require('./routes/labs');
const landingRoutes = require('./routes/landing');
const signupRoute = require('./routes/user');
const MongoStore = require('connect-mongo');
const User = require("./models/user.js");

const i18n = require('i18n');
const cookieParser = require('cookie-parser');

// --- Connect MongoDB ---
const MONGO_URL = "mongodb://127.0.0.1:27017/framfriend";
mongoose.connect(MONGO_URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.log(err));

// --- Session Store Setup ---
const store = MongoStore.create({
  mongoUrl: MONGO_URL,
  crypto: { secret: "mycode" },
  touchAfter: 24 * 3600
});

store.on("error", (err) => {
  console.log("ERROR in MONGO SESSION STORE", err);
});

// --- Session Config ---
const sessionOptions = {
  store,
  secret: "mycode",
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true
  }
};

// --- i18n Config ---
app.use(cookieParser()); // ✅ must come before i18n.init

i18n.configure({
  locales: ['en', 'hi', 'mr'],
  directory: path.join(__dirname, 'locales'),
  defaultLocale: 'en',
  cookie: 'lang',
  queryParameter: 'lang',
  autoReload: true,
  syncFiles: true
});

app.use(i18n.init);

// ✅ Set locale from cookie on each request
app.use((req, res, next) => {
  const lang = req.cookies.lang;
  if (lang && ['en', 'hi', 'mr'].includes(lang)) {
    req.setLocale(lang);
  }
  res.locals.locale = req.getLocale();
  next();
});

// --- View Engine ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- Middleware ---
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// --- Pass common variables to all EJS templates ---
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

// --- Debugging Auth State ---
app.use((req, res, next) => {
  console.log("Is Authenticated:", req.isAuthenticated());
  console.log("Current User:", req.user);
  next();
});

// --- Routes ---
app.use('/', landingRoutes);
app.use('/diagnosis', indexRoutes);
app.use('/labs', labRoutes);
app.use('/', signupRoute);

// --- Error Handlers ---
app.use((req, res, next) => {
  res.status(404).render('error', { message: 'Page not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { message: 'Something went wrong!' });
});

// --- Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
