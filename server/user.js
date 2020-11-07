var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt');
var { recaptcha, pool } = require('./data');
var blacklist = require('./blacklist');

const login = async (username, pass) => {
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
                const token = jwt.sign({username: username}, process.env.JWTSECRET, {expiresIn: '15m'});
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

const create = async (username, pass, email) => {
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

exports.validate = (req, res) => {
    console.log("Valdiating login...");
    login(req.body.username,req.body.password).then(token => {
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
}

exports.invalidate = (req, res) => {
    let auth = req.headers['authorization'];
    let token = auth.split(' ')[1];
    let status = '';
    if (token) {
        blacklist.tokens.push(token)
        jwt.verify(token, process.env.JWTSECRET, {},(err, decoded) => {
            status = `Success: ${decoded.username} has logged out.`;
        })
        res.json({ status: status });
    } else {
        res.json({ status: 'Error: Not logged in.' });
    }
    console.log(status)
}

exports.checklogged = (req, res) => {
    let auth = req.headers['authorization']
    let token = auth.split(' ')[1];
    let blacklisted = blacklist.tokens.find(t => t === token)
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
}

exports.reset = (req, res) => {
    recaptcha.verify(req, (err, data) => {
        if (data) {
            //send mail containing 6 dig. code
            //store code in timed jwt
            res.sendStatus(200);
        }
    })
}

exports.create = (req, res) => {
    create(req.body.username, req.body.password, req.body.email).then(x => {
        console.log(x);
    })
}