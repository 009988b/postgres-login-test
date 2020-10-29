const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const exjwt = require('express-jwt');
const cors = require('cors');

require('dotenv').config()

const PORT = process.env.PORT || 5000;
const { Pool, Client } = require('pg');

const corsOptions = {
    origin: "*",
    optionsSuccessStatus: 200
}

const pool = new Pool({
    user: process.env.USER,
    host: process.env.HOST,
    database: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT
});

pool.on('error', (e, client) => {
    console.error('Error:', e);
});

const getUsers = async () => {
    try {
        const client = await pool.connect();
        const query = "SELECT * from users";
        const response = await client.query(query);
        client.release();
        return response.rows;
    } catch (e) {
        console.error(e);
    }
};

const validateLogin = async (username, pass) => {
    try {
        const client = await pool.connect();
        let query = `select * from users where username = \'${username}\'`;
        const response = await client.query(query);
        if (response.rows.length == 0) {
            console.log(`No users found with name: ${username}`)
            client.release();
            return null;
        } else {
            let hashed = response.rows[0].password;
            const result = await bcrypt.compare(pass, hashed);
            client.release()
            if (result) {
                const token = jwt.sign({username: username}, process.env.JWTSECRET, {expiresIn: '1h'});
                console.log(`User ${username} logged in.`);
                return token;
            } else {
                console.log(`Login Attempt: ${username}'s password incorrectly guessed.`);
                return null;
            }
        }
    } catch (e) {
    }
}

const createUser = async (username, pass, email) => {
    try {
        const client = await pool.connect();
        let query = "select username from users where username = " + "'" + username + "'" ;
        const response = await client.query(query);
        if (response.rows.length == 0) {
            let saltRounds = Math.floor(Math.random() * 10) + 1;
            const salt = await bcrypt.genSalt(saltRounds);
            const hashed = await bcrypt.hash(pass,salt);
            query = "insert into users values(default, \'" + username + "\', \'" + hashed + "\', \'" + email + "\')";
            await client.query(query);
            client.release();
            return "Created user " + username;
        } else {
            // user already exists
            client.release();
            throw new Error(`Error: User \'${username}\' already exists.`);
        }
    } catch (e) {
        console.error(e);
    }
};

const app = express();
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Origin, Authorization, Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Origin", "*");
    next();
});

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors(corsOptions));

const jwtMW = exjwt({
    secret: process.env.JWTSECRET,
    algorithms: [`HS256`],
    ignoreExpiration: true
})

app.listen(PORT, () => {
    console.log("Listening on port: " + PORT);
});

app.get('/', jwtMW, (req,res) => {
    let auth = req.headers['authorization']
    let token = auth.split(' ')[1];
    console.log(token);
    jwt.verify(token, process.env.JWTSECRET, {}, (e, decoded) => {
        console.log(e);
        if (e) {
            res.sendStatus(401);
        } else {
            res.sendStatus(200)
        }
    })
})

app.post('/signup', (req,res) => {
    createUser(req.body.username, req.body.password, req.body.email).then(x => {
        console.log(x);
    })
})

app.post('/login', (req, res) => {
    console.log("Valdiating login..");
    validateLogin(req.body.username,req.body.password).then(token => {
        let success;
        let err = ``;
        if (token === null) {
            success = false;
            err = `Incorrect username or password.`;

        } else {
            success = true;
        }
        res.json({ success: success, token: token, err: err});
        console.log(token);
    })
})