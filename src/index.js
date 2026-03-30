import dotenv from "dotenv";
import connectDB from "./db/db.js";
import app from "./app.js"; // make sure you imported app

dotenv.config({
    path: "./.env"
});

connectDB()
.then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });
})
.catch((error) => {
    console.error("Database connection failed:", error);
});
//this is the basic approach to connect databse for the first time and the main professional approach is in db folder
//  import mongoose from "mongoose";
//  import { DB_NAME } from "./constants.js";
// import express from "express";
// const app = express();
//  (async()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}${DB_NAME}`);
//         console.log("Connected to MongoDB");
//             app.on("error", (error) => {
//                 console.error("Error starting the server:", error);
//                 throw error;
//             });
//             const PORT = process.env.PORT || 3000;
//             app.listen(PORT, () => {
//                 console.log(`Server is running on port ${PORT}`);
//             });
//     } catch (error) {
//         console.error("Error connecting to MongoDB:", error);
//         throw error;
//     }
//  })()