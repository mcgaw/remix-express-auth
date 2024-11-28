import { createRequestHandler } from "@remix-run/express";
import express from "express";
import session from "express-session";
import passport from "passport";
import Strategy from "passport-local";
import bodyParser from "body-parser";

// notice that the result of `remix vite:build` is "just a module"
import * as build from "./build/server/index.js";

const app = express();
app.use(express.static("build/client"));

// For parsing application/x-www-form-urlencoded login form
app.use(bodyParser.urlencoded({ extended: true }));


// Setup the session handling middleware (cookie)
app.use(
  session({
    secret: "session_secret",
    resave: false,
    saveUninitialized: false,

    cookie: {
      secure: false,
    },
  }),
);

// Setup the Passport strategy with a hardcoded sample user.
passport.use(new Strategy(function verify(username, password, cb) {
  if (username == "remix" && password == "run") {
    const user = {
      "username": "remix"
    };
    return cb(null, user)
  }
  return cb(null, false, { message: 'Incorrect username or password' });
}));


// Passport should retrieve authentication information from the session
app.use(passport.authenticate("session"));

// Defines how the user is serialized into the session (cookie)
passport.serializeUser((user, next) => {
  process.nextTick(function () {
    return next(null, user);
  });
});

passport.deserializeUser((obj, next) => {
  process.nextTick(function () {
    return next(null, obj);
  });
});


// Basic login page.
app.get("/login", (req, res) => {
  res.send('<form method="post" action="/dologin"><label for="username">Username:</label><input name="username"/><label for="password">Password:</label><input name="password" type="password"/><button type="submit">Login</button></form>');
});

// Login attempts are routed to Passport, redirecting on success/failure
app.post("/dologin", passport.authenticate('local', { failureRedirect: '/login', failureMessage: true }),
  function (req, res) {
    res.redirect('/');
  });


// Make sure all other routes can only be accessed by an authenticated user
app.use(function (req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
});

// Add the Remix app itself and make sure the user is passed through
app.all("*", createRequestHandler({
  build,
  getLoadContext: function (req) {
    return { user: req.session.passport.user };
  },
}));

app.listen(3000, () => {
  console.log("App listening on http://localhost:3000");
});