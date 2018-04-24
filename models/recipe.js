'use strict';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const RecipeSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  ingredients: {
    type: String,
    required: true,
  },
  recipe: {
    type: String,
    required: true,
  }
});

const Recipe = mongoose.model('Recipe', RecipeSchema);
module.exports = {Recipe};