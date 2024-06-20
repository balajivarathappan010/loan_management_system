const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const express = require('express')
const hbs = require('hbs')
const dotenv = require('dotenv')
const path = require('path')
const location = path.join(__dirname,"./public")
const session = require('express-session')
const moment = require('moment-timezone');
const crypto = require('crypto');
const app = express();


dotenv.config({
    path: "./.env"
})

app.use(cookieParser());
app.use(express.static(location));
app.set('view engine','hbs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json())
hbs.registerHelper('formatDate', function(dateString) {
    const dateObj = new Date(dateString);
    const day = dateObj.getDate();
    const month = dateObj.getMonth() + 1;
    const year = dateObj.getFullYear();
    return `${day}-${month}-${year}`;
});
hbs.registerHelper('if_eq', function(a, b, opts) {
    if (a === b) {
        return opts.fn(this);
    } else {
        return opts.inverse(this);
    }
});
app.use(session({
    secret:crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: true,
}));
app.use('/',require('./routes/get'));
app.use('/post', require('./routes/post'));
app.use((req, res, next)=>{
    res.render('borrower');
})
const port = 1000;
app.listen(port, ()=>{ 
    console.log(`Server started ${port}`);
});