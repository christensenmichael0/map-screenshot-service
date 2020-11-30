const express = require ('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const errorHandler = require('errorhandler');

const app = express();
app.use(bodyParser.json());

// logging middleware
app.use(morgan('dev'));

// TODO:
// add JWT authentication middleware (if we need to eventually hit the service directly)
// https://stackabuse.com/authentication-and-authorization-with-jwts-in-express-js/

app.use("/api", require("./routes/routes"));

app.use(errorHandler());

app.listen(5005, () => {
    console.log(`listening on ${5005}`)
});
