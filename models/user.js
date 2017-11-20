const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../db/database');

const UserSchema = mongoose.Schema({
  first_name:{
    type:String,
    required:false
  },
  last_name:{
    type:String,
    required:false
  },
  email:{
    type:String,
    required:false
  },
  username:{
    type:String,
    required:false
  },  
  password:{
    type:String,
    required:true
  },
 avatar:{
   type:String,
    required:false
 },
  materials:{
    type:Array,
    required:false
  },
  projects:{
    type:Array,
    required:false
  },
  description:{
    type:String,
    required:false
  },
  numbers:{
    type:String,
    required:true
  },
  access_code:{
    type:String,
    required:true
  },
});

const User = module.exports = mongoose.model('User',UserSchema);

module.exports.getUserById = function(id,callback){
  User.findById(id,callback);
}

module.exports.getUserByUsername = function(numbers,callback){
  const query = {numbers:numbers}
  User.findOne(query,callback);
}

module.exports.addUser = function(newUser,callback){
  bcrypt.genSalt(10 ,(err,salt)=>{
    bcrypt.hash(newUser.password, salt, (err,hash)=>{
      if(err) throw err;
      newUser.password = hash;
      newUser.save(callback);
    });
  });
}

module.exports.comparePassword = function(candidatePassword,hash,callback){
  bcrypt.compare(candidatePassword,hash,(err,isMatch)=>{
    if(err) throw err;
    callback(null, isMatch);
  });
}
