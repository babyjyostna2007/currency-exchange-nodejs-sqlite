
## Technologies
- Node.js
- Express.js
- SQLite3
- HTML
- CSS
- JavaScript

The SQLite database `exchange.db` is created automatically.

## Install

Open terminal in the project folder:

npm install express sqlite3

## run
node server.js

## API Endpoints

GET all rates:

http://localhost:3000/api/rates

Currency conversion:

http://localhost:3000/api/rate?from=USD&to=INR&amount=100

POST a new exchange rate:

POST http://localhost:3000/api/rates

JSON body:

{
    "from_currency": "CAD",
    "to_currency": "INR",
    "rate": 61.25
}


