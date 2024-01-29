const express = require('express');
const userController = require('../controllers/register')
const adminController = require('../controllers/admin');
const router = express.Router();

router.post("/signup",userController.signup);
router.post("/login", userController.login);
router.post("/adminSignup", adminController.signup);
router.post("/adminLogin", adminController.login);
router.get("/logout", userController.logout);
router.post("/borrower", userController.borrower);
router.post("/lender",userController.lender);
router.get("/adminlogout", adminController.logout);
router.post("/approve",userController.approved);
router.post("/reject", userController.rejected);
module.exports = router;