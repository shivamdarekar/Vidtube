import jwt from "jsonwebtoken";
import { user } from "../models/user.models.js";
import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";



export const verifyJWT = asyncHandler(async(req, _, next) => {
    const token = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
    if (!token) {
        throw new apiError(401,"unauthorized")
    }

    try {
        const decodedToken = jwt.verify(token, process.env.Access_Token_Secret)
        
        const User = await user.findById(decodedToken?._id)
            .select("-password -refreshToken")
        
        if (!User) {
            throw new apiError(401,"User not found")
        }

        req.User = User

        next()

    } catch (error) {
        throw new apiError(401,error?.message || "Invalid access token")
    }
})
     
