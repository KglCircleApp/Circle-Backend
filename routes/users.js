const express = require('express');
const router = express.Router();
const config = require('../db/database');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

router.post('/register',(req,res,next)=>{

let newUser = User({
  first_name: req.body.first_name,
  last_name: req.body.last_name,
  email: req.body.email,
  username: req.body.username,
  avatar:req.body.avatar,
  materials:req.body.materials,
  password: req.body.password,
  description: req.body.description,
  numbers:req.body.numbers,
  access_code:req.body.access_code
});

  User.addUser(newUser,(err,user)=>{
    if(err){
      res.json({success:false,message:'Error while Registering User',error:err});
    }else{
      res.json({success:true,message:'New User Added Successifully!'});
    }
  });
});

router.post('/login',(req,res,next)=>{
  //res.send('Authentication route');
  const username = req.body.numbers;
  const password = req.body.password;

  User.getUserByUsername(username,(err,user)=>{
    //if(err) throw err;
    if(!user){
      res.json({success:false,message:'User Not Found'});

      
    }
    else{
      User.comparePassword(password,user.password,(err,isMatch)=>{
      //if(err) throw err;
      if(isMatch){
        const token = jwt.sign(user,config.secret,{
           expiresIn:6004800
        });
        res.json({success:true,
          token:token,
          user:{
            id:user._id,
            firstname:user.first_name,
            lastname:user.last_name,
            email:user.email,
            user:user.username,
            materials:user.materials,
            avatar:user.avatar,
            description:user.description,
            numbers:user.numbers
          }

        });
      }else{
        res.json({success:false,message:'Wrong password!'});
      }

    });
    }
    
  });
});

router.get('/profile/:username',(req,res,next)=>{
   User.findOne({username:req.params.username},function(err,user){
      if(err)
        res.send(err);
      res.json(user);
  });
})

router.get('/profile',passport.authenticate('jwt',{session:false}),(req,res,next)=>{
  res.send('Profile route');
});


module.exports = router;
