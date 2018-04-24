'use strict';

const config = require('../config');
const express = require('express');
const router = express.Router();
const passport = require('passport');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

//Note: ideas also taken from jwt drill.  Retyped for understanding and notated for comprehension
const createToken = function(user) {
  return jwt.sign({user}, config.JWT_SECRET, {
    subject: user.username,
    expiresIn: config.JWT_EXPIRY,
    algorithm: 'HS256'
  });
};

const jwtAuth = passport.authenticate('jwt', {session: false});

const localizedAuth = passport.authenticate('local', {session: false});

router.use(bodyParser.json());

router.post('/login', localizedAuth, (req, res) => {
  const authToken = createToken(req.user.serialize());
  res.json({authToken});
});
//Note to self: this posts to the /login using passport authenticate and creates the JWT

router.post('/refresh', jwtAuth, (req, res) => {
  const authToken = createToken(req.user);
  res.json({authToken});
});
//Note to self: the /refresh will refresh your JWT before it expires (otherwise you have to go back to )

module.exports = router;