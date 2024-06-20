const mysql = require('mysql2/promise')

const dbconfig = {
    host:"localhost",
    user:'root',
    password:"",
    database:"loan"
}

const db = mysql.createPool(dbconfig);

module.exports = {db};