const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const {promisify} = require('util');
const {SignupModel, loanModel, adminDataModel} = require('../mongodb');

const signup = async (req, res)=>{
    const {email, password, confirmpassword, pancard, dateofbirth, accountno} = req.body;
    try{
        const hashedPassword = await bcrypt.hash(password, 10);
        await SignupModel.create({email, password: hashedPassword, pancard, dateofbirth, accountno});
        if(password==confirmpassword){
            return res.render('signup',{msg:"Registration successful", msg_type:"correct"});
        }
        else{
            return res.render('signup',{msg:"Password wrong", msg_type:"incorrect"});
        }
    }
    catch(error){
        console.log(error);
        return res.status(500).send("Internel Server error");
    }
}

const login = async(req, res)=>{
    const {email, password, role} = req.body;
    try{
        const user = await SignupModel.findOne({email});
        if(user && await bcrypt.compare(password, user.password)){
            const token = jwt.sign({
                email:user.email
            }, "123",{expiresIn:'1h'});
            const cookieOption = {
                expires: new Date(
                    Date.now()+process.env.JWT_COOKIE_EXPIRES*24*60*60*1000
                ),
                httpOnly:true
            };
            res.cookie('balaji', token, cookieOption);
            if(role==='lender'){
                try{
                    const set_amount = 10000000;
                    const data = await loanModel.find({amount:{$lt:set_amount}})
                    return res.render('lender',{accountno: data});
                }catch(error){
                    console.log(error);
                    return res.status(200).send("Internal Server Error");
                }
            }
            else if(role=='borrower'){
                return res.render('borrower');
            }
        }
        else{
            return res.render('login',{msg: "Enter valid email and password", msg_type:"incorrect"});
        }
    }
    catch(error){
        console.log(error);
        return res.status(500).send("Internal Server error");
    }
}

const isLoggedIn = async (req, res, next)=>{
    if(req.cookies.balaji){
        try{
            const decode = await promisify(jwt.verify)(
                req.cookies.balaji,
                "123"
            );
            const mail= decode.email;
            const result = await SignupModel.findOne({email:mail})
            
            if(!result){
                return next();
            }
            req.mail = result.email;
            return next();
        }
        catch(error){
            console.log("JWT verification error: ",error);;
            next(error);
        }
    }
    else{
        next();
    }
}

const borrower = async(req,res)=>{
    const {accountno, loanType, reason, amount, interest, tenure} = req.body;
    // req.session.amount = amount;
    // console.log(req.session.amount);
    try {
        const regex = /^[A-Za-z0-9]{8}$/;
        if(regex.test(accountno)){
            await loanModel.create({accountno, loanType, reason, amount, interest, tenure});
            return res.render('borrower',{msg:"Loan appiled",msg_type:'correct'});
        }
        else{
            return res.render('borrower',{msg:"Enter valid account number",msg_type:"incorrect"});
        }
    } catch (error) {
        console.log(error);
        res.status(200).render('borrower');
    }
}

const lender = async (req, res)=>{
    try{
        if(req.method==="POST"){
            const loanAccount = req.body.accountno;
            const data = await loanModel.findOne({accountno: loanAccount});
            console.log(loanAccount);
            //const {accountno, loanType, amount, interest, tenure} = data;
            
            if(data){
                return res.redirect("/post/admin");
            }
            else{
                return res.render("history",{accountno:null});
            }
            
            // await loanModel.deleteOne({amount: loanAccount});
        }
    }catch(error){
        console.log(error);
        res.status(200).send("Internal Server Error");
    }
}

const approved = async(req, res)=>{
    try {
        const {accountno, amount, interest, tenure} = req.body;
        console.log(req.body);
        //await admin.updateOne({accountno:accountno},{status:"Approved"});
        const existDoc = await adminDataModel.findOne({accountno:accountno});
        if(existDoc){
            existDoc.status = "approved";
            await existDoc.save();
        }
        else{
            const status = "approved";
            await adminDataModel.create({ accountno, amount, interest, tenure, status });
        }
        await loanModel.deleteOne({amount: amount});
        //res.redirect('/post/admin');
        res.sendStatus(200);
    } catch (error) {
        console.log("Error in /post/approve: ", error);
        res.sendStatus(500);
    }
} 
const rejected = async(req, res)=>{
    try {
        const {accountno, amount, interest, tenure} = req.body;
        //await loanModel.updateOne({accountno:accountno},{status:"Rejected"});
        console.log(req.body);
        const existDoc = await adminDataModel.findOne({accountno:accountno});
        if(existDoc){
            existDoc.status = "rejected";
            await existDoc.save();
        }
        else{
            const status = "rejected";
            await adminDataModel.create({ accountno, amount, interest, tenure, status });
        }
        await loanModel.deleteOne({amount: amount});
        res.sendStatus(200);
    } catch (error) {
        console.log("Error in /post/reject: ", error);
        res.sendStatus(500);
    }
} 
const logout = async(req, res)=>{
    res.cookie("balaji","logout",{
        expires: new Date(Date.now()+2*1000),
        httpOnly:true
    });
    res.status(200).render("login");
};
module.exports = {signup, login, isLoggedIn, logout, borrower, lender, approved, rejected};