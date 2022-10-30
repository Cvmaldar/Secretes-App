//jshint esversion:6
require('dotenv').config()
const express = require("express");
const ejs=require("ejs");
const mongoose=require("mongoose");
const bodyParser=require("body-parser");
const encrypt=require("mongoose-encryption");
const app=express();

app.use(bodyParser.urlencoded({extended:true}));

app.set("view engine","ejs");

app.use(express.static("public"));

mongoose.connect("mongodb://0.0.0.0:27017/userDB")

const userSchema=new mongoose.Schema({
    email:String,
    password:String
});



userSchema.plugin(encrypt, { secret:process.env.SECRET,encryptedFields:["password"]});

const users=mongoose.model("user",userSchema);


app.get("/",function(req,res){
    res.render("home")
});
app.get('/login',function(req,res){
    res.render("login");
})
app.get("/register",function(req,res){
    res.render("register");
})

app.post("/register",function(req,res){
    const user=new users({
        email:req.body.username,
        password:req.body.password
    });
    user.save(function(err){
        if(!err){
            res.render("secrets")
        }else{
            console.log(err);
        }
    });
});

app.post("/login",function(req,res){
    const userName=req.body.username;
    const password=req.body.password;

    users.findOne({email:userName,password:password},function(err){
        if(!err){
            res.render("secrets");
        }else{
            console.log(err);
        }
    });
});
app.listen(3000,function(){
    console.log("your port is on 3000");
});
