# Ingredient Inheritance:
Made using Node.js, complete with testing.
React.js client side app found here: [Ingredient Inheritance Client Github](https://github.com/thinkful-ei19/megan-ing-inheritance-client)

## Table of Contents:
* Description
* API Documentation
* Instructions

### Description:
Server side for Ingredient Inheritance.  Uses Node.js and MongoDB.

### API Documentation:

    * /login creates auth token
    * /refresh refreshes auth token before it expires
    * /users creates a new user based on username and password from request body
    * /recipes get request gets all recipes for a specific user based on userId
    * /recipes post request posts a new recipe based on a users id
    * /recipes/:id get request gets a specific recipe based on recipe id (in params) and userId
    * /recipes/:id put request updates a specific recipe based on recipe id (in params) and userID
    * /recipes/:id delete request deletes a specific recipe based on recipe id (in params) and userId

### Instructions:
    -clone this repo
    -npm install
    -**Check package.json and make sure it has the following:**
        -"dependencies": {
            "bcrypt": "^2.0.1",
            "bcryptjs": "^2.4.3",
            "cors": "^2.8.4",
            "dotenv": "^5.0.1",
            "express": "^4.16.3",
            "jsonwebtoken": "^8.2.1",
            "knex": "^0.14.4",
            "mongoose": "^5.0.6",
            "morgan": "^1.9.0",
            "passport": "^0.4.0",
            "passport-jwt": "^4.0.0",
            "passport-local": "^1.0.0",
            "pg": "^7.4.1"
        },
        "devDependencies": {
            "chai": "^4.1.2",
            "chai-http": "^3.0.0",
            "cross-env": "^5.1.4",
            "mocha": "^5.1.1",
            "nyc": "^11.6.0"
        }
    -nodemon index.js to start dev server (default: localhost:8080)