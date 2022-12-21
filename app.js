//jshint esversion:6
require('dotenv').config()
const express = require("express");
const ejs=require("ejs");
const mongoose=require("mongoose");
const bodyParser=require("body-parser");
// const encrypt=require("mongoose-encryption");
// const md5=require("md5")
const app=express();
// const bcrypt=require("bcrypt")
// const saltRounds = 10;
const session = require('express-session')
const passportLocalMongoose=require("passport-local-mongoose");
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const FacebookStrategy = require('passport-facebook').Strategy;
app.use(bodyParser.urlencoded({extended:true}));
// console.log(md5("12345"));
app.set("view engine","ejs");

app.use(express.static("public"));
app.use(session({
    secret:"Our little secret",
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());
mongoose.connect("mongodb://0.0.0.0:27017/userDB")

const userSchema=new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    facebookId:String,
    secret:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate)
// userSchema.plugin(encrypt, { secret:process.env.SECRET,encryptedFields:["password"]}); 

const users=mongoose.model("user",userSchema);
passport.use(users.createStrategy());

// passport.serializeUser(users.serializeUser());
// passport.deserializeUser(users.deserializeUser());

passport.serializeUser(function(users, done) {
    done(null, users);
  });
  
  passport.deserializeUser(function(users, done) {
    done(null, users);
  });

  passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
  },
  function(accessToken, refreshToken, profile, cb) {
    
    users.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
passport.use(new FacebookStrategy({
    clientID: process.env.CLIENT_ID_FB,
    clientSecret: process.env.CLIENT_SECRET_FB,
    callbackURL: "http://localhost:3000/auth/facebook/secrets",
  },
  
  function(accessToken, refreshToken, profile, cb) {
    users.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",function(req,res){
    res.render("home")
});


app.get('/login',function(req,res){
    res.render("login");
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] }));
   
app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

  app.get('/auth/facebook',
  passport.authenticate('facebook',{scope:["profile"]}));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });
app.get("/register",function(req,res){
    res.render("register");
})
app.get("/logout",function(req,res){
    req.logout(function(err){
        if(err){
            console.log(err);
        }else{
            res.redirect("/");
        }
    });
    
})
app.get("/submit", function(req, res){
    if (req.isAuthenticated()){
      res.render("submit");
    } else {
      res.redirect("/login");
    }
  });
app.post("/submit", function(req, res){
    const submittedSecret = req.body.secret;
  
    // console.log(req.user.id);
  
    users.findById(req.user._id, function(err, foundUser){
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
          foundUser.secret = submittedSecret;
          foundUser.save(function(){
            res.redirect("/secrets");
          });
        }
      }
    });
  });
  app.get("/secrets", function(req, res){
    users.find({"secret": {$ne: null}}, function(err, foundUsers){
      if (err){
        console.log(err);
      } else {
        if (foundUsers) {
          res.render("secrets", {usersWithSecrets: foundUsers});
        }
      }
    });
  });



// app.post("/register",function(req,res){

//     bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
//         const user=new users({
//             email:req.body.username,
//             password:hash
//         });
//         user.save(function(err){
//             if(!err){
//                 res.render("secrets")
//             }else{
//                 console.log(err);
//             }
//         });
//     });



   
// });

app.post("/register",function(req,res){
users.register({username:req.body.username},req.body.password,function(err,users){
if(err){
    console.log(err);
    res.redirect("/register")
}else{
passport.authenticate("local")(req,res,function(){
    res.redirect("/secrets");
});
}
})
});

// app.post("/login",function(req,res){
//     const userName=req.body.username;
//     const password=req.body.password;

//     users.findOne({email:userName,password:password},function(err,foundUSer){
//         if(err){
//             console.log(err)
//         }else{
//             if(foundUSer){
//                 bcrypt.compare(password,foundUSer.password,function(err,result){
//                     if(result===true){
//                         res.render("secrets");
//                     }
//                 });
//             }
//         }
//         });
//     });
app.post("/login",function(req,res){
    const user=new users({
        email:req.body.username,
        password:req.body.password
    })
    user.save();
    req.login(user,function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });

});
app.listen(3000,function(){
    console.log("your port is on 3000");
});