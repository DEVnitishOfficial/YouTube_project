
// require('dotenv').config({path:'./env'}) // it will also work but it break the consistency of the code one is import and another is require syntax
import dotenv from 'dotenv'
import connectDb from './db/index.js'
import app from './app.js'
dotenv.config({
    path:'./env'
})

const port = process.env.PORT || 8000

connectDb()
.then(()=>{
    app.listen(port,()=>{
        console.log(`Server is listening at port http://localhost:${port}`)
    })
    app.on("error",()=>{
        console.log("Error",error)
        throw error
       })
})
.catch((error)=>{
    console.log('MongoDb connection error',error)
})

/*
import express from 'express'
const app = express()

( async()=>{
    try {
       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
       app.on("error",()=>{
        console.log("Error",error)
        throw error
       })
       app.listen(process.env.PORT,()=>{
        console.log(`server is listening on port ${process.env.PORT}`)
       })
    } catch (error) {
        console.error("ERROR",error)
        throw error
        
    }
})()
*/