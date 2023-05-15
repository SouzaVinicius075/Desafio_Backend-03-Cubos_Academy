require('dotenv').config();
const { Pool } = require("pg")
const pool = new Pool({
    user: "postgres",
    password: process.env.PASSWORD,
    host: process.env.HOST,
    database: process.env.DATABASE,
    port: process.env.DATAPORT
})

const query = (text, param) => {
    return pool.query(text, param)
}

module.exports = {
    query
}
