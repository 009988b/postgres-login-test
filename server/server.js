const express = require('express');
const bodyParser = require('body-parser');
const exjwt = require('express-jwt');
const cors = require('cors');
const user = require('./user');
const reset = require('./reset');

require('dotenv').config()

const userMW = exjwt({
    secret: process.env.USER_SECRET,
    algorithms: [`HS256`]
})

const resetMW = exjwt({
    secret: process.env.RESET_SECRET,
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

//General
//User
app.get('/user/isauth', userMW, user.isAuth)
app.get('/user/deauth', user.invalidate)
app.post('/user/new', user.create)
app.post('/user/auth', user.validate)
//Reset
app.post('/reset/init', reset.init)
app.post('/reset/auth', reset.check)
app.post('/reset/set-pw', resetMW, reset.setPass)