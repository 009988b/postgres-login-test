const nm = require('nodemailer')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { recaptcha, pool } = require('./data')

const createCode = (email) => {
    let c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ``
    for (let i = 0; i < 6; i++) {
        code += c.charAt(Math.floor(Math.random() * c.length))
    }
    let info = {
        email: email,
        code: code,
        expires: Date.now() + 300000 //5 min
    }
    this.active.push(info)
    return info;
}

const update = () => {
    let status = `[UPDATE] active reset codes: ${this.active.length} -> `
    for (const i of this.active) {
        if (Date.now() >= i.expires) {
            this.active.splice(this.active.indexOf(i),1)
        }
    }
    status += `${this.active.length}`
    console.log(status)
}

const send = async (info) => {
    //send email with code
}

const setPass = async (email, pw) => {
    let saltRounds = Math.floor(Math.random() * 10) + 1
    const salt = await bcrypt.genSalt(saltRounds)
    const hashed = await bcrypt.hash(pw, salt)
    const client = await pool.connect()
    let query = `update users set password = '${hashed}' where email = '${email}'`
    let result = await client.query(query)
    console.log(`[PWRESET] ${result.command} ${result.rowCount} (${email})` )
    let name_query = `select username from users where email = '${email}'`
    let name_result = await client.query(name_query)
    client.release()
    return name_result.rows.username
}

const validate = (code) => {
    let result = this.active.find(i => i.code === code);
    if (result) {
        let expiresIn = result.expires - Date.now();
        let payload = {
            email: result.email,
            accepted: true,
            time_left: expiresIn
        }
        return jwt.sign(payload, process.env.RESET_SECRET, {expiresIn: `${expiresIn}ms`})
    } else {
        return null;
    }
}

exports.active = [];

exports.init = (req, res) => {
    recaptcha.verify(req, (err, data) => {
        if (data) {
            let i = createCode(req.body.email)
            res.sendStatus(200);
            console.log(i);
        }
    })
}

exports.check = (req, res) => {
    let token = validate(req.body.code)
    if (token) {
        res.json({
            status: `code ${req.body.code} accepted.`,
            jwt: token
        });
    } else {
        res.json({status: 'code not accepted.'})
    }
}

exports.setPass = (req, res) => {
    setPass(req.body.email, req.body.password).then(username => {
        res.json({
            statusCode: 200,
            username: username
        })
    })
}

setInterval(update, 60000)