const express = require('express')
const userController = require('../controllers/register')
const adminController = require('../controllers/admin');
const router = express.Router()

router.get(['/','/login'],(req, res)=>{
    res.render('login');
})

router.get('/signup',(req, res)=>{
    res.render('signup');
})

router.get('/lender',(req, res)=>{
    res.render('lender');
})
router.get('/admin', adminController.isLoggedIn, (req, res)=>{
    if(req.name){
        res.render('admin',{name:req.name});
    }
    else{
        res.render('adminLogin');
    }
})
router.get('/Home', userController.isLoggedIn,(req, res)=>{
    if(req.mail){
        res.render("Home",{mail: req.mail});
    }
    else{
        res.render("login")
    }
})

router.get('/borrower', (req, res)=>{
    res.render('borrower');
})

router.get('/post/history',(req, res)=>{
    res.render('history');
})

router.get('/adminLogin',(req, res)=>{
    res.render('adminLogin');
})

router.get('/adminSignup', (req, res)=>{
    res.render('adminSignup');
})

module.exports = router;