import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
    path: './env'
})

connectDB()











/*import express from "express";
const app=express()
(async()=>{
    try {
        mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        app.on("error",()=>{
            console.log("ERR: ",error)
            throw error
            
        })
        app.listen(process.env.PORT,()=>{
            console.log(`App is listeing on port ${process.env.PORT}`);
            
        })
    } catch (error) {
        console.error("ERROR: ",error);
        throw error;
    }
})()*/