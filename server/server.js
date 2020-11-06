const express = require('express');
const bodyParser = require('body-parser');
const nodeMailer = require('nodemailer');
const Recaptcha = require('express-recaptcha').RecaptchaV2;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const exjwt = require('express-jwt');
const cors = require('cors');
const { Pool, Client } = require('pg');
require('dotenv').config()

const PORT = process.env.PORT || 5000;

const recap = new Recaptcha('6LcEEt8ZAAAAAFM5nNWDsPteW_9_UtmuBfY1wC-5', process.env.RCSECRET);

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

const validateLogin = async (username, pass) => {
    try {
        const client = await pool.connect();
        let query = `select * from users where username = '${username}'`;
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
                return token;
            } else {
                console.log(`Login Attempt: ${username}'s password incorrectly guessed.`);
                return null;
            }
        }
    } catch (e) {
        console.error(e);
    }
}

const createUser = async (username, pass, email) => {
    try {
        const client = await pool.connect();
        let query = `select username from users where username = '${username}' or email = ${email}`;
        const res = await client.query(query);
        if (res.rows.length == 0) {
            let saltRounds = Math.floor(Math.random() * 10) + 1;
            const salt = await bcrypt.genSalt(saltRounds);
            const hashed = await bcrypt.hash(pass,salt);
            query = "insert into users values(default, \'" + username + "\', \'" + hashed + "\', \'" + email + "\')";
            await client.query(query);
            client.release();
            return "Created user " + username;
        } else {
            client.release();
            throw new Error(`Error: User \'${username}\' already exists.`);
        }
    } catch (e) {
        console.error(e);
    }
};

const blacklist = [];

setInterval(() => {
    let status = `blacklisted tokens: ${blacklist.length} -> `;
    for (const t of blacklist) {
        try {
            jwt.verify(t, process.env.JWTSECRET)
        } catch (e) {
            //if token no longer valid
            blacklist.splice(blacklist.indexOf(t),1)
        }
    }
    status += `${blacklist.length}`
    console.log(status)
},30000)

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
    let blacklisted = blacklist.find(t => t === token)
    if (!blacklisted) {
        jwt.verify(token, process.env.JWTSECRET, {}, (e, decoded) => {
            console.log(e);
            if (e) {
                res.sendStatus(401);
            } else {
                res.sendStatus(200)
            }
        })
    } else {
        res.sendStatus(401);
    }
})

app.post('/signup', (req,res) => {
    createUser(req.body.username, req.body.password, req.body.email).then(x => {
        console.log(x);
    })
})

app.post('/mail-reset', (req,res) => {
    recap.verify(req, (err, data) => {
        if (data) {
            //send mail containing 6 dig. code
            //store code in timed jwt
            //
        }
    })
})

app.post('/login', (req, res) => {
    console.log("Valdiating login...");
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
        console.log(`${req.body.username} logged in? ${success}`);
    })
})

app.get('/logout', (req,res) => {
    let auth = req.headers['authorization'];
    let token = auth.split(' ')[1];
    let status = '';
    if (token) {
        blacklist.push(token)
        jwt.verify(token, process.env.JWTSECRET, {},(err, decoded) => {
            status = `Success: ${decoded.username} has logged out.`;
        })
        res.json({ status: status });
    } else {
        res.json({ status: 'Error: Not logged in.' });
    }
    console.log(status)
})