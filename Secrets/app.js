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
  password: String
});

////setup passport step 4:
userSchema.plugin(passportLocalMongoose);
//////

////Mongoose Encryption plugin:
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password'] }); //Note: Created before model

const User = new mongoose.model('User', userSchema);

////setup passport step 5:
// use static authenticate method of model in LocalStrategy
passport.use(new LocalStrategy(User.authenticate()));

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//////


app.get('/', (req, res) => {
  res.render('home');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/secrets', (req, res) => {
  if(req.isAuthenticated()) {
    res.render('secrets');
  } else {
    res.redirect('/login');
  }
});

app.get('/logout', (req, res) => {
  req.logout(); //passport.js method
  res.redirect('/');
})

//update the code

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

app.listen(3000, () => {
  console.log('Server is starting on port 3000.');
})
