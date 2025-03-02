import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index:true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
            index:true
        },
        avatar: {
            type: String, //cloudinary url
            required:true,
        },
        coverImage: {
            type: String,           
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        password: {
            type: String,
            required:[true,"Password is required"]
        },
        refreshToken: {
            
        }
    },
    {timestamps:true}
)

//encrypt password before saving
userSchema.pre("save", async function (next) {

    // If the password field is not modified, skip hashing and move to the next middleware
    if (!this.isModified("password")) return next()
    
   // Hash the password using bcrypt (10 is the salt rounds)
    this.password = bcrypt.hashSync(this.password, 10)
    
    //bcrypt.hashSync() → runs synchronously blocks execution until hashing is done

    next()
})

//it checks the password enterd by user and encrypted password saved in database is same or not

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}


//When using a regular function, this refers to the document (instance) of the Mongoose model.
//This means inside generateAccessToken(), this will point to the current user object
// Avoid ()=>{} in Mongoose methods, as it does not have its own this, leading to errors.

userSchema.methods.generateAccessToken = function () {
    //short lived access token
    return jwt.sign({    //use to create jwt
        _id: this._id,
        email: this.email,
        username: this.username,
        fullname: this.fullname,    //token contailn this data
    },
        process.env.Access_Token_Secret,
        {expiresIn:process.env.Access_Token_Expiry});
}

userSchema.methods.generateRefreshToken = function () {
    //long lived refresh token
    return jwt.sign({
        _id: this._id,
        
    },
        process.env.Refresh_Token_Secret,
        {expiresIn:process.env.Refresh_Token_Expiry});
}


// 1️: User logs in → Receives both tokens.
// 2️: User makes API requests using the access token.
// 3️: Access token expires → Frontend sends the refresh token to get a new one.
// 4️: If refresh token is valid, a new access token is issued.
// 5️: If the refresh token is expired or invalid, user must log in again.






export const user = mongoose.model("user", userSchema);