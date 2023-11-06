const express = require("express");
const { UserModel } = require("../models/user.model");
const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer');
const randomString = require('randomstring')
const jwt = require("jsonwebtoken");
const { BlacklistModel } = require("../models/blacklist.model");
require("dotenv").config()

const userRouter = express.Router();

// Register
userRouter.post("/register", async(req,res)=> {
    try {
        const { firstName, lastName, email, password } = req.body;
        const existingUser = await UserModel.find({email});
        if(existingUser.length){
            return res.status(400).json({msg: "User already exists"})
        }else{
            bcrypt.hash(password, 10, async(err, hash)=>{
                const user = new UserModel({ firstName, lastName, email, password: hash});
                await user.save();
                res.status(200).json({msg: "Registered Successfully!!",user: req.body})
            });
        }
    } catch (err) {
        res.status(500).json({error: err.message})
    }
})

// Login
userRouter.post("/login",async(req,res)=> {
    const {email, password} = req.body;
    try {
        const user = await UserModel.findOne({email});  
        if(user){
            const userName = user.firstName;
            bcrypt.compare(password, user.password, async(err, result)=> {
                if(result){
                    let token = jwt.sign({userID: user._id, username: user.firstName}, process.env.secretKey)
                    res.status(200).json({msg: "Login Successful!!", token, userName })
                }else{
                    res.status(200).json({msg: "Wrong Credentails!!"})
                }
            });
        }else{
            res.status(400).json({msg: "User does not exist!!"})
        }
    } catch (err) {
        res.status(400).json({error: err.message});
    }
});

// Logout
// userRouter.get("/logout",(req,res)=>{
//     const token = req.headers.authorization?.split(" ")[1]
//     try {
//        BlacklistModel.push(token);
//        res.status(200).json({msg: "User has been logged out"}) 
//     } catch (error) {
//         res.status(200).json({error: error.message}) 
//     }
// })

userRouter.get('/logout', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
  
    if (!token) {
      return res.status(400).json({ error: 'Token not provided in the request header' });
    }
  
    try {
      // Create a new document in the BlacklistModel collection with the token
      await BlacklistModel.create({ blacklist: [token] });
      res.status(200).json({ msg: 'User has been logged out' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//       user: process.env.mail, // Replace with your Gmail email address
//       pass: process.env.mailpass,  // Replace with your Gmail password or an App Password
//     },
// })

// userRouter.post('/forgot-password', async (req, res) => {
//     const { email } = req.body;
//     try {
//       const user = await UserModel.findOne({ email });
  
//       if (!user) {
//         return res.status(400).json({ message: 'User not found' });
//       }
  
//       // Generate a reset token and send a reset email
//       const resetToken = jwt.sign({ userID: user._id, email: user.email }, process.env.secretKey, { expiresIn: '1h' });
  
//       // Construct the reset link with the resetToken
//       const resetLink = `https://localhost:9500/reset-password?token=${resetToken}`;
  
//       // Email content
//       const mailOptions = {
//         from: process.env.mail,  // Use the same email address as the transporter
//         to: user.email,
//         subject: 'Password Reset',
//         text: `Click the link below to reset your password:\n${resetLink}`,
//       };
  
//       // Send the email
//       transporter.sendMail(mailOptions, (error, info) => {
//         if (error) {
//           console.error(error);
//           return res.status(500).json({ message: 'Failed to send reset email' });
//         }
  
//         console.log('Reset email sent:', info.response);
//         res.status(200).json({ message: 'Password reset link sent to your email' });
//       });
//     } catch (err) {
//       res.status(500).json({ error: err.message });
//     }
// });

userRouter.post("/forget-password", async(req,res)=>{
  try{
    const email = req.body.email;
    const userData = await UserModel.findOne({email:email});

    if(userData){
      const randomstring = randomString.generate();
      const data = await UserModel.updateOne({email:email},{$set:{token:randomstring}});
      sendresetPasswordMail(userData.email, randomString);
      res.status(200).send({"message":"Please check your inbox of mail and reset your password"})
    } else {
      res.status(400).send({"message":"This email does not exist"})
    }
  } catch(err){
    res.status(400).send({"message":err.message})
  }
})

const sendresetPasswordMail = async(email, token)=>{
  try{
    const transporter = nodemailer.createTransport({
       host : 'smtp.gmail.com',
       port:9500,
       secure : false,
       requireTLS : true,
       auth : {
        user : process.env.email,
        pass : process.env.mailPass
       }
    })

    const mailOptions = {
      from : process.env.email,
      to : email,
      subject : 'For Reset Password',
      htmml : `<p>Hey, Please check copy the link<a href=""http://localhost:9500/api/reset-password?token=`+token+`> and reset your password</a></p>`
    }
    transporter.sendMail(mailOptions, (error, info)=>{
      if(error){
        console.log(error);
      }else{
        console.log("Mail has been sent:- ", info.response)
      }
    })

  } catch(err){
    res.status(400).send({"message":err.message})
  }
}

userRouter.post("/reset-password", sendresetPasswordMail)

module.exports = {
    userRouter
}