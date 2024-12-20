const mongoose = require('mongoose');
// require('dotenv').config();

module.exports = function mongooseConnectoin() {
    // mongoose.set('strictQuery',true);
    mongoose.connect('mongodb://127.0.0.1:27017/blogApp' , {
        
    })
    .then(()=>{
        console.log("DB CONNECTED");
    })
    .catch((err)=>{
        console.log("Error connecting to DB",err);
    })
};