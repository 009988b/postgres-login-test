const { Pool } = require('pg');
const Recaptcha = require('express-recaptcha').RecaptchaV2;
require('dotenv').config()

exports.recaptcha = new Recaptcha('6LcEEt8ZAAAAAFM5nNWDsPteW_9_UtmuBfY1wC-5', process.env.RCSECRET);

exports.pool = new Pool({
    user: process.env.USER,
    host: process.env.HOST,
    database: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT
}).on('error', (e, client) => {
    console.error('Error:', e);
});