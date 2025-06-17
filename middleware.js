const { model } = require("mongoose");
const User=require("./models/user.js");


// module.exports.isloggedin = (req, res, next) => {
//     if (!req.isAuthenticated()) {
//         req.session.redirectUrl = req.originalUrl;;
//         req.flash("error", "you must be logged in to create listing");
//         return res.redirect("/login");
//     }
//     next();
// }

module.exports.isloggedin = (req, res, next) => {
    if (!req.isAuthenticated()) {
        if (req.method === "GET") {
            req.session.redirectUrl = req.originalUrl;
        } else {
            req.session.redirectUrl = "/diagnosis"; // fallback for POST routes
        }
        req.flash("error", "You must be logged in to perform this action.");
        return res.redirect("/login");
    }
    next();
};


module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};