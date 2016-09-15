var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var FacebookStrategy = require("passport-facebook").Strategy;

var configAuth = require("./auth.js");
var User = require("../models/User.js")

// To serialize currently logged in user into string data that can be stored in cookie.
passport.serializeUser(function(user, done) {
  done(null, user.id)
});
// To extract user ID from cookie and find corresponding user in database.
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user)
  })
});
passport.use("local-signup", new LocalStrategy({
  usernameField: "email",
  passwordField: "password",
  passReqToCallback: true
}, function(req, email, password, done) {
  User.findOne({"local.email": email}, function(err, user) {
    if (err) return done(err)
    if (user) return done(null, false, req.flash("signupMessage", "That email is already taken."))
    if (email.length === 0) return done(null, false, req.flash("signupMessage", "Please enter your email."))
    // If no error and email is not taken, add new user to database.
    var newUser = new User()
    newUser.local.email = email
    newUser.local.password = newUser.generateHash(password)
    newUser.local.first_name = req.body.first_name
    newUser.local.last_name = req.body.last_name
    newUser.local.dob = req.body.dob
    newUser.save(function(err){
      if(err) throw err
      return done(null, newUser)
    })
  })
}));
passport.use("local-login", new LocalStrategy({
  usernameField: "email",
  passwordField: "password",
  passReqToCallback: true
}, function(req, email, password, done){
  User.findOne({"local.email": email}, function(err, user) {
    if (err) throw err
    // If user not in database, send message to browser indicating such.
    if (!user) return done(null, false, req.flash("loginMessage", "No user found."))
    if (!user.validPassword(password)) return done(null, false, req.flash("loginMessage", "Invalid credentials."))
    return done(null, user)
  })
}));
passport.use(new FacebookStrategy({
    clientID: configAuth.facebookAuth.clientID,
    clientSecret: configAuth.facebookAuth.clientSecret,
    callbackURL: configAuth.facebookAuth.callbackURL,
    profileFields: configAuth.facebookAuth.profileFields
}, function(token, refreshToken, profile, done) {
  User.findOne({"facebook.id": profile.id}, function(err, user) {
    if (err) return done(err)
    if (user) {
      return done(null, user)
    } else {
      var newUser = new User()
      newUser.facebook.id = profile.id
      newUser.facebook.token = token
      newUser.facebook.name = profile.displayName
      newUser.facebook.email = profile.emails[0].value
      newUser.save(function(err) {
        if(err) throw err
        return done(null, newUser)
      })
    }
  })
}));
module.exports = passport;
