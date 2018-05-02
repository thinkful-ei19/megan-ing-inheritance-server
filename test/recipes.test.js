'use strict';
const app = require('../index');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const { TEST_DATABASE_URL, JWT_SECRET } = require('../config');

const Recipe = require('../models/recipe');
const User = require('../models/user');

const seedRecipes = require('../db/seed/recipe');
const seedUsers = require('../db/seed/users');

const expect = chai.expect;

chai.use(chaiHttp);

describe('Ingredient Inheritance-Recipes', function () {

  let user = {};
  let token;

  before(function () {
    return mongoose.connect(TEST_DATABASE_URL)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function () {
    user.id = seedUsers[0]._id;
    user.fullname = seedUsers[0].fullname;
    user.username = seedUsers[0].username;
    token = jwt.sign({ user }, JWT_SECRET, { subject: user.username });

    return Promise.all([
      Recipe.insertMany(seedRecipes),
      User.insertMany(seedUsers),
      User.ensureIndexes()
    ]);
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });

  describe('GET /api/recipes', function () {
    it.only('should return the correct number of recipes', function () {
      const dbPromise = Recipe.find({ userId: user.id });
      const apiPromise = chai.request(app)
        .get('/api/recipes')
        .set('Authorization', `Bearer ${token}`);

      return Promise.all([dbPromise, apiPromise])
        .then(([dbData, apiResults]) => {
          expect(apiResults).to.have.status(200);
          expect(apiResults).to.be.json;
          expect(apiResults.body).to.be.a('array');
          expect(apiResults.body).to.have.length(dbData.length);
          // expect(apiResults.body).to.have.length(2);
        });
    });

    it('should return a list with the correct right fields', function () {
      const dbPromise = Note.find({ userId: user.id });
      const apiPromise = chai.request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${token}`);

      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
          res.body.forEach(function (item) {
            expect(item).to.be.a('object');
            expect(item).to.have.keys('id', 'title', 'content', 'created', 'folderId', 'tags', 'userId');
          });
        });
    });

    it('should return correct search results for a searchTerm query', function () {
      const searchTerm = 'gaga';
      const re = new RegExp(searchTerm, 'i');
      const dbPromise = Note.find({
        userId: user.id,
        title: { $regex: re }
        // $or: [{ 'title': { $regex: re } }, { 'content': { $regex: re } }]
      });
      const apiPromise = chai.request(app)
        .get(`/api/notes?searchTerm=${searchTerm}`)
        .set('Authorization', `Bearer ${token}`);

      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(1);
          expect(res.body[0]).to.be.an('object');
          expect(res.body[0].id).to.equal(data[0].id);
        });
    });

    it('should return correct search results for a folderId query', function () {
      let data;

      return Folder.findOne()
        .then((_data) => {
          data = _data;
          const dbPromise = Note.find({ userId: user.id, folderId: data.id });
          const apiPromise = chai.request(app)
            .get(`/api/notes?folderId=${data.id}`)
            .set('Authorization', `Bearer ${token}`);

          return Promise.all([dbPromise, apiPromise]);
        })
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });

    it('should return an empty array for an incorrect query', function () {
      const searchTerm = 'NotValid';
      const re = new RegExp(searchTerm, 'i');
      const dbPromise = Note.find({
        userId: user.id,
        title: { $regex: re }
        // $or: [{ 'title': { $regex: re } }, { 'content': { $regex: re } }]
      });
      const apiPromise = chai.request(app)
        .get(`/api/notes?searchTerm=${searchTerm}`)
        .set('Authorization', `Bearer ${token}`);

      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });
  });

  describe('GET /api/notes/:id', function () {
    it('should return correct notes', function () {
      let data;

      return Note.findOne({ userId: user.id })
        .then(_data => {
          data = _data;

          return chai.request(app)
            .get(`/api/notes/${data.id}`)
            .set('Authorization', `Bearer ${token}`);
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'title', 'content', 'created', 'folderId', 'tags', 'userId');
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
        });
    });

    it('should respond with a 400 for improperly formatted id', function () {
      const badId = 'NOT-A-VALID-ID';

      return chai.request(app)
        .get(`/api/notes/${badId}`)
        .set('Authorization', `Bearer ${token}`)
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.eq('The `id` is not valid');
        });
    });

    it('should respond with a 404 for an invalid id', function () {
      return chai.request(app)
        .get('/api/notes/DOESNOTEXIST')
        .set('Authorization', `Bearer ${token}`)
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });
  });

  describe('POST /api/notes', function () {
    it('should create and return a new item when provided valid data', function () {
      const newItem = {
        'title': 'The best article about cats ever!',
        'content': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...'
      };
      let res;

      return chai.request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send(newItem)
        .then(function (_res) {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys('id', 'title', 'content', 'created', 'tags', 'userId');

          return Note.findOne({ _id: res.body.id, userId: user.id });
        })
        .then(data => {
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
        });
    });

    it('should return an error when missing "title" field', function () {
      const newItem = { 'foo': 'bar' };

      return chai.request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send(newItem)
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `title` in request body');
        });
    });
  });

  describe('PUT /api/notes/:id', function () {
    it('should update the note', function () {
      const updateItem = {
        'title': 'What about dogs?!',
        'content': 'woof woof'
      };
      let data;

      return Note.findOne({ userId: user.id })
        .then(_data => {
          data = _data;

          return chai.request(app)
            .put(`/api/notes/${data.id}`)
            .send(updateItem)
            .set('Authorization', `Bearer ${token}`);
        })
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys('id', 'title', 'content', 'created', 'folderId', 'tags', 'userId');
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(updateItem.title);
          expect(res.body.content).to.equal(updateItem.content);
        });
    });


    it('should respond with a 400 for improperly formatted id', function () {
      const badId = 'NOT-A-VALID-ID';
      const updateItem = {
        'title': 'What about dogs?!',
        'content': 'woof woof'
      };

      return chai.request(app)
        .put(`/api/notes/${badId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateItem)
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.eq('The `id` is not valid');
        });
    });

    it('should respond with a 404 for an invalid id', function () {
      const updateItem = {
        'title': 'What about dogs?!',
        'content': 'woof woof'
      };

      return chai.request(app)
        .put('/api/notes/DOESNOTEXIST')
        .set('Authorization', `Bearer ${token}`)
        .send(updateItem)
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });

    it('should return an error when missing "title" field', function () {
      const updateItem = { 'foo': 'bar' };

      return chai.request(app)
        .put('/api/notes/9999')
        .set('Authorization', `Bearer ${token}`)
        .send(updateItem)
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `title` in request body');
        });
    });
  });

  describe('DELETE  /api/notes/:id', function () {
    it('should delete an item by id', function () {
      let data;

      return Note
        .findOne({ userId: user.id })
        .then(_data => {
          data = _data;

          return chai.request(app)
            .delete(`/api/notes/${data.id}`)
            .set('Authorization', `Bearer ${token}`);
        })
        .then(res => {
          expect(res).to.have.status(204);
          expect(res.body).to.be.empty;

          return Note.findById(data.id);
        })
        .then((item) => {
          expect(item).to.be.null;
        });
    });
  });
});