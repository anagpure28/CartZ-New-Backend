const express = require("express");
const cors = require("cors");
const { connection } = require("./Config/db");
const { userRouter } = require("./routes/user.route");

require("dotenv").config()

const app = express();
app.use(cors())
app.use(express.json());

app.use("/users",userRouter);

app.get("/",(req,res)=>{
    res.send("Welcome to CartZ..")
})

app.listen(process.env.port,async()=> {
    try {
        await connection
        console.log(`Running on port ${process.env.port}`)
        console.log("Connected to the DB")
    } catch (err) {
        console.log(err)
    }
})