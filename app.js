const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const express = require('express')
const hbs = require('hbs')
const dotenv = require('dotenv')
const path = require('path')
const location = path.join(__dirname,"./public")
const helpers = require('./helpers');
const app = express()

dotenv.config({
    path: "./.env"
})
app.use(cookieParser());
app.use(express.static(location));
app.set('view engine','hbs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json())

hbs.registerHelper(helpers);
hbs.registerHelper('if_eq', function(a, b, opts) {
    if (a === b) {
        return opts.fn(this);
    } else {
        return opts.inverse(this);
    }
});
app.use('/',require('./routes/get'));
app.use('/post', require('./routes/post'));
app.listen(2000, ()=>{ 
    console.log('Server started');
})