require('dotenv').config(); //dotenv needs to be required at top FIRST THING!
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
// const encrypt = require('mongoose-encryption'); //Mongoose encryption
// const md5 = require('md5');
bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

mongoose.connect('mongodb://localhost:27017/usersDB', {useNewUrlParser: true, useUnifiedTopology: true});

//Mongoose Schema Object for encryption
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

////Mongoose Encryption plugin:
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password'] }); //Note: Created before model

const User = new mongoose.model('User', userSchema);

app.get('/', (req, res) => {
  res.render('home');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.listen(3000, () => {
  console.log('Server is starting on port 3000.');
})

app.post('/register', (req, res) => {
  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    // Store hash in your password DB.
    const newUser = new User({
      email: req.body.username,
      password: hash
    });

    newUser.save((err) => {
      if(err) {
        console.log(err);
      } else {
        res.render('secrets');
      }
    });
  });

});

app.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({email: username}, (err, foundUser) => {
    if(err) {
      console.log(err);
    } else {
      if(foundUser) {
        bcrypt.compare(password, foundUser.password, function(err, result) {
            // result == true
            if(result === true) {
              res.render('secrets');
            }
        });
      }
    }
  });

});
