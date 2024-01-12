
import mongoose, {Schema} from 'mongoose'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const userSchema = new Schema({
    userName:{
        type:String,
        required:true,
        unique:true,
        lowerCase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowerCase:true,
        trim:true
    },
    fullName:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String, // cloudinary url
        required:true
    },
    coverImage:{
        type:String
    },
    watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    password:{
        type:String,
        required:[true, "password is required"]
    },
    refreshToken:{
        type:String,
    }
},{timestamps:true})

// userSchema.pre(save, () => {}) 
// never write callback function here because we know the ``` the call back function does not have the reference of the context and here context is very important because here save event is running on the userSchema so here, the context of userSchema is required, so here we should always use traditional function as you can see below ```

userSchema.pre("save", async function(next){
    if(!this.isModified("password")){
        return next()
    }
    this.password = bcrypt.hash(this.password,10)
    next()
    //  The bcrypt.hash function takes two arguments: the first is the data to be hashed (in this case, this.password), and the second is the salt rounds. The value 10 represents the number of rounds the hashing algorithm will execute. The higher the number of rounds, the more secure but slower the hashing process. In this case, 10 is a reasonable and commonly used value for a balance between security and performance.

    // When hashing passwords, a salt is a random value that is generated uniquely for each password.
   
})

userSchema.methods.isPasswordCorrect = async function(password){
   return await bcrypt.compare(password,this.password)
}
userSchema.methods.generateAccessToken = function(){
   return jwt.sign(
       { 
        _id:this._id,
        email:this.email,
        userName:this.userName,
        fullName:this.fullName
       },
       process.env.ACCESS_TOKEN_SECRET,
       {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
       }

    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        { 
         _id:this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
         expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
 
     )
}
export const User = mongoose.model("User",userSchema)