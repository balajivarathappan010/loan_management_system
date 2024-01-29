const express = require('express')
const {AdminSignupModel, loanModel, adminDataModel} = require('../mongodb')
const jwt = require('jsonwebtoken');
const {promisify} = require('util');
const bcrypt = require('bcryptjs')

const signup = async(req, res)=>{
    const {username, password, confirmpassword} = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await AdminSignupModel.create({username, password:hashedPassword})
        if(password==confirmpassword){
            return res.render('adminSignup',{msg:'Registration successful',msg_type:"correct"})
        }
        else{
            return res.render('adminsignup',{msg:"Registration failed",msg_type:"incorrect"})
        }
    } catch (error) {
        console.log(error);
        return res.status(500).send("Internel server error");
    }
}

const login = async(req, res)=>{
    const {username, password} = req.body;
    try {
        const admin = await AdminSignupModel.findOne({username})
        const user_data = await adminDataModel.find()
        if(admin && admin.username=='admin' && await bcrypt.compare(password, admin.password)){
            const token = jwt.sign({
                username:admin.username
            }, "123",{expiresIn:'1h'});
            const cookieOption = {
                expires: new Date(
                    Date.now()+process.env.JWT_COOKIE_EXPIRES*24*60*60*1000
                ),
                httpOnly:true
            };
            res.cookie('balaji', token, cookieOption);
            return res.render('admin',{data:user_data, msg_type:"correct"});
            
        }
        return res.render('adminLogin',{msg:"Enter valid username or password",msg_type:"incorrect"});
    } catch (error) {
        console.log(error);
        return res.status(500).send("Invalid server error");
    }
}

const isLoggedIn = async (req, res, next)=>{
    if(req.cookies.balaji){
        try{
            const decode = await promisify(jwt.verify)(
                req.cookies.balaji,
                "123"
            );
            const mail= decode.username;
            const result = await AdminSignupModel.findOne({username:username})
            
            if(!result){
                return next();
            }
            req.name = result.username;
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

const logout = async(req, res)=>{
    res.cookie("balaji","logout",{
        expires: new Date(Date.now()+2*1000),
        httpOnly:true
    });
    res.status(200).render("adminLogin");
};
module.exports = {signup, login, isLoggedIn, logout};