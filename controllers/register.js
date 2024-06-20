const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {promisify} = require('util');
const {format} = require('date-fns');
const {db} = require('../sql')

const signup = async (req, res)=>{
    const {email, password, confirmpassword, pancard, dateofbirth, accountno} = req.body;
    try{
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (email, password, pancard, dateofbirth) VALUES (?,?,?,?)';
        await db.query(sql,[email, hashedPassword, pancard, dateofbirth])
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
        req.session.email = email;
        const sql = "SELECT email, password FROM users WHERE email = ?";
        
        const [user] = await db.query(sql,[email]);
        if(user.length>0 && !await bcrypt.compare(password, user[0].password)){
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
                    return res.render('lender');
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
            const sql = "SELECT * FROM users WHERE email = ?";
            const rows = await db.query(sql, mail);
            const em = rows[0].map(e=>email);
            console.log(next())
            if(!result){
                return next();
            }
            req.mail = em;
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

const borrower = async (req, res) => {
    const { accountno, loanType, reason, amount, interest, tenure } = req.body;
    const email = req.session.email;
    const regex = "^([._a-z0-9]+)@";
    const performRegex = email.match(regex)[1];
    const dateOfApplication = format(new Date(), 'yyyy-MM-dd'); // Format date
    console.log(dateOfApplication);

    try {
        const sqlForCheck = "SELECT * FROM loanData WHERE accountno = ? AND loanType = ? AND reason = ? AND dateOfApplication = ?";
        const [rows] = await db.query(sqlForCheck, [accountno, loanType, reason, dateOfApplication]);
        if(rows.length>0 && interest>=rows[0].interest && tenure>=rows[0].tenure){
            if (rows.length > 0) {
                // If a matching record is found, update it
                const existingRecord = rows[0];
                const newAmount = existingRecord.amount + parseFloat(amount);
                const newInterest = Math.max(existingRecord.interest, parseFloat(interest));
                const newTenure = Math.max(existingRecord.tenure, parseInt(tenure));
    
                const sqlForUpdate = "UPDATE loanData SET amount = ?, interest = ?, tenure = ? WHERE id = ?";
                await db.query(sqlForUpdate, [newAmount, newInterest, newTenure, existingRecord.id]);
    
                return res.render('borrower', { msg: "Loan updated successfully", msg_type: 'correct' });
            }
        }
        else {
            // If no matching record is found, insert a new record
            const sqlForInsert = "INSERT INTO loanData (username, accountno, loanType, reason, amount, interest, tenure, dateOfApplication) VALUES (?,?,?,?,?,?,?,?)";
            await db.query(sqlForInsert, [performRegex, accountno, loanType, reason, amount, interest, tenure, dateOfApplication]);

            return res.render('borrower', { msg: "Loan applied successfully", msg_type: 'correct' });
        }
    } catch (error) {
        console.error("Error processing loan application:", error.message);
        return res.status(500).render('borrower', { msg: "Internal Server Error", msg_type: "error" });
    }
};

const lender = async (req, res)=>{
    try{
        const email = req.session.email;
        const regex = "^([._a-z0-9]+)@";
        const performRegex = email.match(regex)[1];
        const {amount} = req.body;
        const am = Number(amount);
        const sql = "SELECT * FROM loanData WHERE amount>? AND username<>?";
        const data = await db.query(sql, [am, performRegex]);
        const loanTypes = [];
        for(let i=0;i<data[0].length;i++){
            loanTypes.push(data[0][i]);
        }
        return res.render('lender',{accountno:loanTypes});
    }catch(error){ 
        console.log(error);
        res.status(200).send("Internal Server Error");
    } 
}
 
const approved = async(req, res)=>{
    try {
        const {username, accountno, amount, reason, interest, tenure} = req.body;
        const approveDate = format(new Date(), 'yyyy-MM-dd');
        const sql = 'SELECT * FROM adminData WHERE username = ? AND accountno = ? AND amount = ? AND reason = ? AND interest = ? AND tenure = ?';
        const values = [username, accountno, amount, reason, interest, tenure];
        const [rows] = await db.query(sql, values);
        const sqlData = "SELECT dateOfApplication FROM loanData WHERE username=? AND accountno=? AND reason=? AND amount=? AND interest=? AND tenure=?";
        const Datavalues = [username, accountno, reason, amount, interest, tenure];
        const Dataloan = await db.query(sqlData, Datavalues);
        const date = Dataloan[0].map(d=>d.dateOfApplication);
        if(rows.length==0){
            const status = "approved";
            const valuessql = [username, accountno, reason, amount, interest, tenure, date, approveDate, status];
            const sqlc = "INSERT INTO adminData (username, accountno, reason, amount, interest, tenure, applyDate, statusDate, status) VALUES (?,?,?,?,?,?,?,?,?);"
            await db.query(sqlc, valuessql);
        }
        else{
            res.send('your data exist');
            return;
        }
        const sqlDelete = "DELETE FROM loanData WHERE amount=?";
        await db.query(sqlDelete, [amount]);
        res.sendStatus(200);
    } catch (error) {
        console.log("Error in /post/approve: ", error);
        res.sendStatus(500);
    }
}
const history = async(req, res)=>{
    try {
        const email = req.session.email;
        const regex = "^([._a-z0-9]+)@";
        const performRegex = email.match(regex)[1];
        const sql = "SELECT * FROM adminData WHERE username=?";
        const rows = await db.query(sql, [performRegex]);
        if(rows.length>0){
            return res.render('history',{data:rows[0]});
        }
        return res.render('history');
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
    
} 
const rejected = async(req, res)=>{
    try {
        const {username, accountno, amount, reason, interest, tenure} = req.body;
        const sql = 'SELECT * FROM adminData WHERE username = ? AND accountno = ? AND amount = ? AND reason = ? AND interest = ? AND tenure = ?';
        const values = [username, accountno, amount, reason, interest, tenure];
        const [rows] = await db.query(sql, values);
        const sqlData = "SELECT dateOfApplication FROM loanData WHERE username=? AND accountno=? AND reason=? AND amount=? AND interest=? AND tenure=?";
        const Datavalues = [username, accountno, reason, amount, interest, tenure];
        const Dataloan = await db.query(sqlData, Datavalues);
        const date = Dataloan[0].map(d=>d.dateOfApplication);
        const rejectDate = format(new Date(), 'yyyy-MM-dd');
        if(rows.length==0){
            const status = "rejected";
            const valuessql = [username, accountno, reason, amount, interest, tenure, date, rejectDate, status];
            const sqlData = "INSERT INTO adminData (username, accountno, reason, amount, interest, tenure, applyDate, statusDate, status) VALUES (?,?,?,?,?,?,?,?,?)";
            await db.query(sqlData, valuessql);
        }
        else{
            res.send('your data already exist')
        }
        const sqlDelete = "DELETE FROM loanData WHERE amount=?";
        await db.query(sqlDelete, [amount]);
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
module.exports = {signup, login, isLoggedIn, logout, borrower, lender, approved, rejected, history};