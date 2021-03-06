var jwt = require('jsonwebtoken')

exports.tokens = [];

const update = () => {
    let status = `[UPDATE] blacklisted tokens: ${this.tokens.length} -> `;
    for (const t of this.tokens) {
        try {
            jwt.verify(t, process.env.USER_SECRET)
        } catch (e) {
            //if token invalid
            this.tokens.splice(this.tokens.indexOf(t),1)
        }
    }
    status += `${this.tokens.length}`
    console.log(status)
}

setInterval(update,60000)