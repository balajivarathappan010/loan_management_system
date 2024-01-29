const mongoose = require('mongoose')

mongoose.connect("mongodb://0.0.0.0:27017/loan")
.then(()=>{
    console.log("mogodb connected");
})
.catch(()=>{
    console.log("erro");
})

const SignupSchema = new mongoose.Schema({
    email:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true
    },
    pancard:{
        type:String,
        unique: true,
        required:true
    },
    dateofbirth:{
        type:String,
        required:true
    }
});

const loanSchema = new mongoose.Schema({
    accountno:{
        type: String,
        required: true
    },
    loanType:{
        type:String,
        required: true
    },
    amount:{
        type:Number,
        required:true
    },
    interest:{
        type:Number,
        required: true
    },
    tenure:{
        type: Number,
        required: true
    }
})

const AdminSignupSchema = new mongoose.Schema({
    username:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true
    }
})

const adminDataSchema = new mongoose.Schema({
    accountno:{
        type:String,
        required: true
    },
    amount:{
        type:Number,
        required:true
    },
    interest:{
        type:Number,
        required: true
    },
    tenure:{
        type: Number,
        required: true
    },
    status:{
        type:String,
        required:true
    }
})

const SignupModel = mongoose.model('signup', SignupSchema);
const loanModel = mongoose.model('loan', loanSchema);
const AdminSignupModel = mongoose.model('admin', AdminSignupSchema)
const adminDataModel = mongoose.model('data', adminDataSchema)
module.exports = {SignupModel, loanModel, AdminSignupModel, adminDataModel};