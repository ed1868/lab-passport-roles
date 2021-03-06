const express        = require('express');
const bcrypt         = require('bcrypt');
const path           = require('path');
const swaggy        = require('swag');

const bcryptSalt     = 10;
const passportRouter = express.Router();
const bodyParser     = require('body-parser');
const mongoose       = require('mongoose');
const passport       = require('passport');
const LocalStrategy  = require('passport-local').Strategy;

const ensureLogin    = require('connect-ensure-login');
const User           = require('../models/User');

// ////////////////////Checks Role of user to know what page to redirect to ////////
checkRoles = role => function (req, res, next) {
  if (req.isAuthenticated() && req.user.role.includes(role)) {
    return next();
  }
  res.redirect('/user-profile');
};

passportRouter.get('/user-profile', ensureLogin.ensureLoggedIn(), (req, res, next) => {
  const userRole = req.user.role;
  const userID    = req.user.id;
  const username  = req.user.username;
  User.find({})
    .then((users) => {
      res.render('passport/userProfile', {
        users, userRole: req.user.role, userId : req.user.id, username : req.user.username,
      });
    });
});
// ///////////////BOSS ROUTE HANDLING //////////////////////
passportRouter.get('/user-actions', ensureLogin.ensureLoggedIn(), checkRoles(['Boss']), (req, res) => {
  const userRole = req.user.role;
  const userID    = req.user.id;
  const username  = req.user.username;

  if (userRole === 'Boss') {
    User.find({})
      .then((users) => {
        res.render('passport/actionsPage', {
          users, userRole: req.user.role, userId : req.user.id, username : req.user.username,
        });
      });
  } else {
    res.redirect('/');
  }
});


passportRouter.post('/user-actions', ensureLogin.ensureLoggedIn(), (req, res) => {
  const addUserName    = req.body.newname;
  const deleteUser     = req.body.removename;
  const newRole        = req.body.newRole;
  if (addUserName === '' && deleteUser === '' && newRole === '') {
    res.render('passport/actionsPage', { message : 'INDICATE USERNAME AND PASSWORD' });
    return;
  }
  if (addUserName !== '') {
    User.findOne({ addUserName })
      .then((user) => {
        if (user !== null) {
          res.render('passport/signup', { message : 'This User already exists' });
          return;
        }
        const salt = bcrypt.genSaltSync(bcryptSalt);
        const hashPass = bcrypt.hashSync('ironhack', salt);
        const newUser = new User({
          username : addUserName,
          password : hashPass,
          role     : newRole,
        });
        newUser.save()
          .then((saveUser) => {
            console.log('you added a new user to the database BOSSS', saveUser);
            console.log('entra');
            res.redirect('/user-actions');
          })
          .catch((err) => {
            console.log(err);
            res.render('passport/signup', { message : 'Something went wrong' });
          });
      })
      .catch((error) => {
        next(error);
      });
  }
  if (deleteUser !== '') {
    User.deleteOne({ username: deleteUser })
      .then(() => {
        console.log('youve deleted an employee BITCHHH');
        res.redirect('/actions-page');
      }).catch((err) => {
        console.log(err);
      });
  }
});
// ////////////////////////////USER SIGN UP ROUTES////////////////////////////////////

passportRouter.get('/signup', (req, res, next) => {
  res.render('passport/signup');
});


passportRouter.post('/signup', (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;
  const role     = req.body.role;
  if (username === '' || password === '') {
    res.render('passport/signup', { message : 'INDICATE USERNAME AND PASSWORD' });
    return;
  }
  User.findOne({ username }).then((user) => {
    if (user !== null) {
      res.render('passport/signup', { message : 'This User already exists' });
      return;
    }
    const salt = bcrypt.genSaltSync(bcryptSalt);
    const hashPass = bcrypt.hashSync(password, salt);

    const newUser = new User({
      username,
      password : hashPass,
      role,
    });

    newUser.save((err) => {
      if (err) {
        res.render('passport/signup', { message : 'Something went wrong' });
      } else {
        res.redirect('/');
      }
    });
  })
    .catch((error) => {
      next(error);
    });
});

// ///////////////////////////// USER LOG IN ROUTES////////////////////////////
passportRouter.get('/login', (req, res, next) => {
  res.render('passport/login');
});


passportRouter.post('/login', passport.authenticate('local', {
  successRedirect: '/user-actions',
  failureRedirect: '/login',
  failureFlash: true,
  passReqToCallback: true,


}));

passportRouter.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/login');
});

// /////////////////////////////// USER EDIT ROUTES//////////////////////////////////////

passportRouter.get('/:id/edit', ensureLogin.ensureLoggedIn(), (req, res) => {
  const id = req.params;
  const user = req.body.user;

  res.render('passport/editForm', {  id : req.params });
});

module.exports = passportRouter;
