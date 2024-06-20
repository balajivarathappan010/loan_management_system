const jwt = require('jsonwebtoken');
const {promisify} = require('util');
const {db} = require('../sql');
const bcrypt = require('bcryptjs');

const signup = async(req, res)=>{
    const {username, password, confirmpassword} = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = "INSERT INTO admin (username, password) VALUES (?,?)";
        await db.query(sql, [username, hashedPassword]);
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
        const sql = "SELECT * FROM admin WHERE username=?";
        const admin = await db.query(sql, [username]);
        const adminName = admin[0].map(name=>username)
        const passName = admin[0].map(pass=>password);
        const dataSql = "SELECT *FROM adminData";
        const user_data = await db.query(dataSql);
        if(admin.length>0 && adminName=='admin' && passName==password){
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
            return res.render('admin',{data:user_data[0], msg_type:"correct"});
            
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
            const sql = "SELECT * FROM WHERE username=?";
            const result = await db.query(sql, [username]);
            
            if(result.length==0){
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