const express = require('express');
const bodyParser = require('body-parser');
const exjwt = require('express-jwt');
const cors = require('cors');
const user = require('./user');

require('dotenv').config()

const jwtMW = exjwt({
    secret: process.env.JWTSECRET,
    algorithms: [`HS256`]
})

const app = express();
const PORT = process.env.PORT || 5000;
module.exports = app;

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Origin, Authorization, Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Origin", "*");
    next();
});

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors({
    origin: "*",
    optionsSuccessStatus: 200
}));

app.listen(PORT, () => {
    console.log("Listening on port: " + PORT);
});

app.get('/', jwtMW, user.checklogged)
app.post('/signup', user.create)
app.post('/mail-reset', user.reset)
app.post('/login', user.validate)
app.get('/logout', user.invalidate)