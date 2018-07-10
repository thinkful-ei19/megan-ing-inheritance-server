# Ingredient Inheritance:
Made using Node.js, complete with testing.
React.js client side app found here: [Ingredient Inheritance Client Github](https://github.com/thinkful-ei19/megan-ing-inheritance-client)

## Table of Contents:
* Tech Used
* Description
* API Documentation
* Instructions

### Tech Used:
Node.js
Express
MongoDB
Mocha/Chai

### Description:
Ingredient Inheritance is a web app made to store secret family recipes. It is a password-protected site with protected endpoints so that users are only able to view their own recipes/no one outside the family can see them.

As a user, you are able to register, login, logout, create new recipes, view saved recipes, edit saved recipes, and delete saved recipes. The nav bar also contains an instructions button for the user so you have guided/step-by-step instructions on how to use the app.

As long as the user remains active on the page, their JWT will automatically refresh just before every hour (JWT expires in an hour on server side unless refreshed), allowing the user to remain on the main page with all their recipes.

If the user is inactive for an hour, the app will log them out on the client side, not refresh their JWT on the server side, and also prompt them 1 minute before the logout. However, if they click the "Stay on Page" button in the prompt, the client will send off the request to refresh their JWT and the user will be able to remain on the page.

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
