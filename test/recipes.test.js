'use strict';
const {app} = require('../index');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const { TEST_DATABASE_URL, JWT_SECRET, JWT_EXPIRY } = require('../config');

const {Recipe} = require('../models/recipe');
const {User} = require('../models/user');

const seedRecipes = require('../db/seed/recipes');
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
    user.userId = seedUsers[0]._id;
    user.fullName = seedUsers[0].fullName;
    user.username = seedUsers[0].username;
    token = jwt.sign({user}, JWT_SECRET, {
      subject: user.username,
      expiresIn: JWT_EXPIRY,
      algorithm: 'HS256'
    });

    return Promise.all([
      Recipe.insertMany(seedRecipes),
      User.insertMany(seedUsers)
    ])
      .then(()=>User.ensureIndexes());
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });

  describe('GET /api/recipes', function () {
    it('should return the correct number of recipes', function () {
      const dbPromise = Recipe.find({ userId: user.userId });
      const apiPromise = chai.request(app)
        .get('/api/recipes')
        .set('Authorization', `Bearer ${token}`);

      return Promise.all([dbPromise, apiPromise])
        .then(([dbData, apiResults]) => {
          expect(apiResults).to.have.status(200);
          expect(apiResults).to.be.json;
          expect(apiResults.body).to.be.a('array');
          expect(dbData.length).to.equal(2);
          expect(apiResults.body.length).to.equal(2);
          expect(apiResults.body).to.have.length(dbData.length);

        });
    });

    it('should return a list with the right fields', function () {
      const dbPromise = Recipe.find({ userId: user.userId });
      const apiPromise = chai.request(app)
        .get('/api/recipes')
        .set('Authorization', `Bearer ${token}`);

      return Promise.all([dbPromise, apiPromise])
        .then(([dbData, apiResults]) => {
          expect(apiResults).to.have.status(200);
          expect(apiResults).to.be.json;
          expect(apiResults.body).to.be.a('array');
          expect(apiResults.body).to.have.length(dbData.length);
          apiResults.body.forEach(function (item) {
            expect(item).to.be.a('object');
            expect(item).to.have.keys('_id', 'title', 'ingredients', 'recipe', 'userId', '__v');
          });
        });
    });
  });

  describe('GET /api/recipes/:id', function () {
    it('should return correct recipe', function () {
      let recipeData;

      return Recipe.findOne({ userId: user.userId })
        .then(data => {
          recipeData = data;

          return chai.request(app)
            .get(`/api/recipes/${recipeData.id}`)
            .set('Authorization', `Bearer ${token}`);
        })
        .then((apiResult) => {
          expect(apiResult).to.have.status(200);
          expect(apiResult).to.be.json;
          expect(apiResult.body).to.be.an('object');
          expect(apiResult.body).to.have.keys('_id', 'title', 'ingredients', 'recipe', 'userId', '__v');
          expect(apiResult.body._id).to.equal(recipeData.id);
          expect(apiResult.body.title).to.equal(recipeData.title);
          expect(apiResult.body.content).to.equal(recipeData.content);
        });
    });

    it('should respond with a 404 for a bad id', function () {
      const badId = 'DOES-NOT-EXIST';

      return chai.request(app)
        .get(`/api/notes/${badId}`)
        .set('Authorization', `Bearer ${token}`)
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(404);
          expect(res.body.message).to.eq('Not Found');
        });
    });
  });

  describe('POST /api/recipes', function () {
    it('should create and return a new recipe item when provided valid data', function () {
      const newRecipe = {
        'title': 'The best article about cats ever!',
        'ingredients': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...',
        'recipe': 'test'
      };
      let apiResult;

      return chai.request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${token}`)
        .send(newRecipe)
        .then(function (_apiResult) {
          apiResult = _apiResult;
          expect(apiResult).to.have.status(201);
          expect(apiResult).to.have.header('location');
          expect(apiResult).to.be.json;
          expect(apiResult.body).to.be.a('object');
          expect(apiResult.body).to.have.keys('_id', 'title', 'ingredients', 'recipe', 'userId', '__v');

          return Recipe.findOne({ _id: apiResult.body._id, userId: user.userId });
        })
        .then(data => {
          expect(apiResult.body.title).to.equal(data.title);
          expect(apiResult.body.ingredients).to.equal(data.ingredients);
          expect(apiResult.body.recipe).to.equal(data.recipe);
        });
    });

    it('should return an error when missing "title" field', function () {
      const newRecipe = { 'foo': 'bar', 'ingredients':'test', 'recipe':'test' };

      return chai.request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${token}`)
        .send(newRecipe)
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing title in request body');
        });
    });
    it('should return an error when missing "ingredients" field', function () {
      const newRecipe = { 'title': 'bar', 'foo':'test', 'recipe':'test' };

      return chai.request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${token}`)
        .send(newRecipe)
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing ingredients in request body');
        });
    });
    
    it('should return an error when missing "recipe" field', function () {
      const newRecipe = { 'title': 'bar', 'ingredients':'test', 'foo':'test' };

      return chai.request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${token}`)
        .send(newRecipe)
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing recipe in request body');
        });
    });

  });

  describe('PUT /api/recipes/:id', function () {
    it('should update the recipe', function () {
      const updateRecipe = {
        'title': 'Changed',
        'ingredients': 'check',
        'recipe':'changed'
      };
      let dbData;

      return Recipe.findOne({ userId: user.userId })
        .then(data => {
          dbData = data;

          return chai.request(app)
            .put(`/api/recipes/${dbData.id}`)
            .send(updateRecipe)
            .set('Authorization', `Bearer ${token}`);
        })
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys('_id', 'title', 'recipe', 'ingredients', '__v', 'userId');
          expect(res.body._id).to.equal(dbData.id);
          expect(res.body.title).to.equal(updateRecipe.title);
          expect(res.body.content).to.equal(updateRecipe.content);
        });
    });


    it('should respond with a 404 for an invalid id', function () {
      const updateRecipe = {
        'title': 'Changed',
        'ingredients': 'check',
        'recipe':'changed'
      };

      return chai.request(app)
        .put('/api/recipe/NOTGOINGTOWORK')
        .set('Authorization', `Bearer ${token}`)
        .send(updateRecipe)
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });


    it('should return an error when missing "title" field', function () {
      const updatedRecipe = { 'foo': 'bar', 'ingredients':'test', 'recipe':'test' };
      
      return chai.request(app)
        .put('/api/recipes/5ae21b12d0656a0cb89a583c')
        .set('Authorization', `Bearer ${token}`)
        .send(updatedRecipe)
        .catch(err => err.response)
        .then(res => {
          console.log(res.body);
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `title` in request body');
        });
    });
    
    it('should return an error when missing "ingredients" field', function () {
      const updatedRecipe = { 'title': 'bar', 'foo':'test', 'recipe':'test' };
      
      return chai.request(app)
        .put('/api/recipes/5ae21b12d0656a0cb89a583c')
        .set('Authorization', `Bearer ${token}`)
        .send(updatedRecipe)
        .catch(err => err.response)
        .then(res => {
          console.log(res.body);
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `ingredients` in request body');
        });
    });
   
    it('should return an error when missing "recipe" field', function () {
      const updatedRecipe = { 'title': 'bar', 'ingredients':'test', 'foo':'test' };
      
      return chai.request(app)
        .put('/api/recipes/5ae21b12d0656a0cb89a583c')
        .set('Authorization', `Bearer ${token}`)
        .send(updatedRecipe)
        .catch(err => err.response)
        .then(res => {
          console.log(res.body);
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `recipe` in request body');
        });
    });
  
  });

  describe('DELETE  /api/notes/:id', function () {
    it('should delete an item by id', function () {
      let data;

      return Note
        .findOne({ userId: user.userId })
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