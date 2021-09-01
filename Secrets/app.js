require('dotenv').config(); //dotenv needs to be required at top FIRST THING!
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
// const encrypt = require('mongoose-encryption'); //Mongoose encryption
// const md5 = require('md5');
// bcrypt = require('bcrypt');
// const saltRounds = 10;

////setup passport step 1:
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const passportLocalMongoose = require('passport-local-mongoose');
//////

////OAuth2.0 (Google):
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
//////

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

////setup passport step 2:
app.use(session({
  secret: 'Our little secret.',
  resave: false,
  saveUninitialized: false
}));
//////

////setup passport step 3:
app.use(passport.initialize());
app.use(passport.session());
//////

mongoose.connect('mongodb://localhost:27017/usersDB', {useNewUrlParser: true, useUnifiedTopology: true});

//Mongoose Schema Object for encryption
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String
});

////setup passport step 4:
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
//////

////Mongoose Encryption plugin:
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password'] }); //Note: Created before model

const User = new mongoose.model('User', userSchema);

////setup passport step 5:
// use static authenticate method of model in LocalStrategy
passport.use(new LocalStrategy(User.authenticate()));

// use static serialize and deserialize of model for passport session support
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
//////

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

////OAuth 2.0 (Google):
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
//////

app.get('/', (req, res) => {
  res.render('home');
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect('/secrets');
  });

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/secrets', (req, res) => {
  User.find({'secret':{$ne: null}}, (err, foundUsers) => { //find all users where secret isn't null
    if(err) {
      console.log(err);
    } else {
      if(foundUsers) {
        res.render('secrets', {usersWithSecrets: foundUsers});
      }
    }
  });

  // if(req.isAuthenticated()) {
  //   res.render('secrets');
  // } else {
  //   res.redirect('/login');
  // }
});

app.get('/submit', (req, res) => {
  if(req.isAuthenticated()) {
    res.render('submit');
  } else {
    res.redirect('/login');
  }
});

app.get('/logout', (req, res) => {
  req.logout(); //passport.js method
  res.redirect('/');
})

app.post('/register', (req, res) => {
  //register() included in passport-local-mongoose:
  User.register({username: req.body.username}, req.body.password, function(err, user) {
    if(err) {
      console.log(err);
      res.redirect('/register');
    } else {
      passport.authenticate('local')(req, res, function() {
        res.redirect('/secrets');
      });
    }
  });
  // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
  //   // Store hash in your password DB.
  //   const newUser = new User({
  //     email: req.body.username,
  //     password: hash
  //   });
  //
  //   newUser.save((err) => {
  //     if(err) {
  //       console.log(err);
  //     } else {
  //       res.render('secrets');
  //     }
  //   });
  // });

});

app.post('/login', (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  //login() is a passport method:
  req.login(user, function(err){
    if(err) {
      console.log(err);
    } else {
      passport.authenticate('local')(req, res, function() {
        res.redirect('/secrets');
      });
    }
  });
  // const username = req.body.username;
  // const password = req.body.password;
  //
  // User.findOne({email: username}, (err, foundUser) => {
  //   if(err) {
  //     console.log(err);
  //   } else {
  //     if(foundUser) {
  //       bcrypt.compare(password, foundUser.password, function(err, result) {
  //           // result == true
  //           if(result === true) {
  //             res.render('secrets');
  //           }
  //       });
  //     }
  //   }
  // });
});

app.post('/submit', (req, res) => {
  const submittedSecret = req.body.secret;

  console.log(req.user.id);

  User.findById(req.user.id, (err, foundUser) => {
    if(err) {
      console.log(err);
    } else {
      if(foundUser) {
        foundUser.secret = submittedSecret;
        foundUser.save(() => {
          res.redirect('/secrets');
        });
      }
    }
  });
});

app.listen(3000, () => {
  console.log('Server is starting on port 3000.');
})
