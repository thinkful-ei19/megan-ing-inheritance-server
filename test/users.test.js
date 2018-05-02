'use strict';

const {app} = require('../index');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const { TEST_DATABASE_URL } = require('../config'); 

const {User} = require('../models/user');

const expect = chai.expect;

chai.use(chaiHttp);

describe('Noteful API - Users', function () {
  const username = 'testUser';
  const password = 'testPassword';
  const fullName = 'Test User';

  before(function () {
    return mongoose.connect(TEST_DATABASE_URL)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function () {
    return User.ensureIndexes();
  });

  afterEach(function () {
    return User.remove();
  });

  after(function () {
    return mongoose.disconnect();
  });

  describe('/api/users', function () {
    describe('POST', function () {
      it('Should create a new user with working password', function () {
        let apiResponse;
        return chai
          .request(app)
          .post('/api/users')
          .send({ username, password, fullName })
          .then(res => {
            apiResponse = res;
            expect(apiResponse).to.have.status(201);
            expect(apiResponse.body).to.be.an('object');
            expect(apiResponse.body).to.have.keys('userId', 'username', 'fullName');
            expect(apiResponse.body.userId).to.exist;
            expect(apiResponse.body.username).to.equal(username);
            expect(apiResponse.body.fullName).to.equal(fullName);
            return User.findOne({ username });
          })
          .then(user => {
            expect(user).to.exist;
            expect(user.id).to.equal(apiResponse.body.userId);
            expect(user.fullName).to.equal(fullName);
            return user.checkPassword(password);
          })
          .then(isValid => {
            expect(isValid).to.be.true;
          });
      });

      it('Should reject users when no username', function () {
        return chai
          .request(app)
          .post('/api/users')
          .send({ password, fullName })
          .catch(err => err.response)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.message).to.equal('Missing field');
          });
      });

      it('Should reject users with no password', function () {
        return chai
          .request(app)
          .post('/api/users')
          .send({ username, fullName })
          .catch(err => err.response)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.message).to.equal('Missing field');
          });

      });

      it('Should reject users with non-string username', function () {
        return chai
          .request(app)
          .post('/api/users')
          .send({ username: 1234, password, fullName })
          .catch(err => err.response)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.message).to.equal('Incorrect field type: expected string');
          });
      });

      it('Should reject users with non-string password', function () {
        return chai
          .request(app)
          .post('/api/users')
          .send({ username, password: 1234, fullName })
          .catch(err => err.response)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.message).to.equal('Incorrect field type: expected string');
          });
      });

      it('Should reject users with whitespaced username', function () {
        return chai
          .request(app)
          .post('/api/users')
          .send({ username: ` ${username} `, password, fullName })
          .catch(err => err.response)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.message).to.equal('Cannot start or end with whitespace');
          });
      });

      it('Should reject users with whitespaced password', function () {
        return chai
          .request(app)
          .post('/api/users')
          .send({ username, password: ` ${password}`, fullName })
          .catch(err => err.response)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.message).to.equal('Cannot start or end with whitespace');
          });
      });

      it('Should reject with empty username', function () {
        return chai
          .request(app)
          .post('/api/users')
          .send({ username: '', password, fullName })
          .catch(err => err.response)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.message).to.equal('Must be at least 1 characters long');
          });
      });

      it('Should reject users with password less than 8 characters', function () {
        return chai
          .request(app)
          .post('/api/users')
          .send({ username, password: 'asdfghj', fullName })
          .catch(err => err.response)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.message).to.equal('Must be at least 8 characters long');
          });
      });

      it('Should reject users with password greater than 72 characters', function () {
        const longPassword='noplxelbfwewauvpcjlchvqmffeoaunykydtcscinfzfpqovtrkypfoidkxmnigvlqsdztzjv';
        return chai
          .request(app)
          .post('/api/users')
          .send({ username, password: longPassword, fullName })
          .catch(err => err.response)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.message).to.equal('Must be at most 72 characters long');
          });
      });

      it('Should reject users with taken username', function () {
        return User
          .create({
            username,
            password,
            fullName
          })
          .then(() => {
            return chai
              .request(app)
              .post('/api/users')
              .send({ username, password, fullName });
          })
          .catch(err => err.response)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.message).to.equal('Username already taken');
          });
      });

      it('Should trim fullname', function () {
        return chai
          .request(app)
          .post('/api/users')
          .send({ username, password, fullName: ` ${fullName} ` })
          .then(res => {
            expect(res).to.have.status(201);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.keys('username', 'fullName', 'userId');
            expect(res.body.username).to.equal(username);
            expect(res.body.fullName).to.equal(fullName);
            return User.findOne({ username });
          })
          .then(user => {
            expect(user).to.not.be.null;
            expect(user.fullName).to.equal(fullName);
          });
      });
    });
  });
});