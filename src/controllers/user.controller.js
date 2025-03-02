import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js"
import { user } from "../models/user.models.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const User = await user.findById(userId)   //fetch user from database

        const accessToken = User.generateAccessToken()  //generate tokens 
        const refreshToken = User.generateRefreshToken()

        User.refreshToken = refreshToken  //store refresh token in database
        await User.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }
    } catch (error) {
        throw new apiError(500, "Something went wrong while generating access and refresh tokens ")
    }
}


const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, username, password } = req.body

    //validation
    if (
        [fullname, username, email, password].some((field) =>
            field?.trim() == "")
    ) {
        throw new apiError(400, "all fields are required")
    }

    //if user already exist
    const existedUser = await user.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new apiError(409, "user with username and email already exixst")
    }

    console.warn(req.files);
    const avatarLocalPath = req.files?.avatar?.[0]?.path
    const coverLocalPath = req.files?.coverImage?.[0]?.path

    if (!avatarLocalPath) {
        throw new apiError(400, "Avatar is missing")
    }

    // const avatar = await uploadOnCloudinary(avatarLocalPath)
    // let coverImage = ""
    // if (coverLocalPath) {
    //     coverImage = await uploadOnCloudinary(coverLocalPath)
    // }

    let avatar;
    try {
        avatar = await uploadOnCloudinary(avatarLocalPath)
        console.log("uploaded avatar", avatar);

    } catch (error) {
        console.log("Error uploading avatar", error);
        throw new apiError(500, "failed to upload avatar")
    }

    let coverImage;
    try {
        coverImage = await uploadOnCloudinary(coverLocalPath)
        console.log("uploaded cover image", coverImage);

    } catch (error) {
        console.log("Error uploading cover image", error);
        throw new apiError(500, "failed to upload cover image")
    }


    try {
        const User = await user.create({
            fullname,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase()
        })

        const createUser = await user.findById(User._id).select(
            "-password -refreshToken"
        )

        if (!createUser) {
            throw new apiError(500, "Something went wrong while registering a user")
        }

        return res
            .status(201)
            .json(new ApiResponse(201, createUser, "User register successfully"))
    } catch (error) {
        console.log("user creation failed");

        if (avatar) {
            await deleteFromCloudinary(avatar.public_id)
        }
        if (coverImage) {
            await deleteFromCloudinary(coverImage.public_id)
        }

        throw new apiError(500, "something went wrong while registering a user and images were deleted")
    }
});


const loginUser = asyncHandler(async (req, res) => {
    //get data from body
    const { username, email, password } = req.body

    //validation
    if (!password) {
        throw new apiError(400, "Password is requires")
    }

    const User = await user.findOne({
        $or: [{ username }, { email }]
    })

    if (!User) {
        throw new apiError(404, "User not found")
    }

    //validate password
    const isPasswordValid = await User.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new apiError(401, "Invalid Credentials")
    }

    const { accessToken, refreshToken } = await
        generateAccessAndRefreshToken(User._id);

    const loggedInUser = await user.findById(User._id)
        .select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV == "production"
    }

    //Prevents JavaScript access to the cookie.
    //This means the cookie cannot be read, modified, or stolen using document.cookie in the browser.
    //This protects the cookie from XSS (Cross-Site Scripting) attacks.
    //When NODE_ENV is "production", the cookie will only work on secure HTTPS connections.


    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(
            200,
            { user: loggedInUser, accessToken, refreshToken },
            "user logged in successfully"
        ))

})


const logoutUser = asyncHandler(async (req, res) => {
    await user.findByIdAndUpdate(
        req.User._id,
        {
            $unset: {
                refreshToken: 1,
            }
        },
        { new: true }
    )
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV == "production",
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"))

})

//Cookies are automatically stored by the browser and sent with every request to the server.
//No need for manual storage in localStorage or sessionStorage.
//When a user logs in, the server sets a cookie in the response.
//On each request, the browser automatically includes the cookie.
//The server verifies the cookie and processes the request.
//maxAge (in milliseconds)  Ensures the user stays logged in for 7 days before requiring re-authentication.



const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new apiError(401, "Refresh token is required")
    }

    try {
        const decodedToken = jwt.verify(  //jwt
            incomingRefreshToken,
            process.env.Refresh_Token_Secret
        )
        const User = await user.findById(decodedToken?._id)

        if (!User) {
            throw new apiError(401, "Invalid refresh token")
        }

        if (User.refreshToken !== incomingRefreshToken) {
            throw new apiError(401, "Invalid refresh token")
        }

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV == "production",
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(User._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed successfully"
                )
            )


    } catch (error) {
        throw new apiError(500, "something went wrong while refreshing access token")
    }
})


const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    // Find user from database
    const User = await user.findById(req.User?._id);

    // Verify old password
    const isPasswordValid = await User.isPasswordCorrect(oldPassword);
    if (!isPasswordValid) {
        throw new apiError(401, "Invalid old password");
    }

    // Strong password validation
    // const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    // if (!passwordRegex.test(newPassword)) {
    //     throw new apiError(400, "Password must be at least 8 characters long, contain uppercase and lowercase letters, a number, and a special character.");
    // }

    // Update password
    User.password = newPassword;

    // Force logout: remove refresh token from DB
    User.refreshToken = null;

    // Save updated user data
    await User.save({ validateBeforeSave: false });

    //their is another approach that we create new access and refresh token and store new refresh token in db
    //that help in user acc stay login in current device but logout from other devices each device has diff. refresh token

    return res
        .status(200)
        .clearCookie("accessToken")
        .clearCookie("refreshToken")
        .json(new ApiResponse(200, {}, "Password changed successfully. Please login again."));
});


const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.User, "current user details"))
});


const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body

    if (!fullname && !email) {
        throw new apiError(400, "fullname and Email are required")
    }

    const User = await user.findByIdAndUpdate(
        req.User?._id,
        {
            $set: {
                fullname,
                email: email
            }
        },
        { new: true }
    ).select("-password -refreshToken")

    //$set ensures only the given fields are modified (avoids unintentional overwrites).
    //If additional logic is applied in findByIdAndUpdate, $set avoids replacing the whole document accidentally.
    //Recommended when modifying only specific fields instead of updating the entire document.


    return res.status(200).json(new ApiResponse(200, User, "Account detailes updated successfully"))

})


const updateAvatar = asyncHandler(async (req, res) => {
    const userId = req.User._id

    const existedUser = await user.findById(userId)
    if (!existedUser) {
        throw new apiError(404, "USer not found")
    }

    const oldAvatar = existedUser.avatar;
    if (oldAvatar) {
        const publicId = oldAvatar.split("/").pop().split(".")[0];

        // Extract public_id safely if uppar approach fails
        //const urlParts = oldAvatar.split("/");
        //const fileName = urlParts[urlParts.length - 1]; // Get last part
        //const publicId = fileName.split(".")[0]; // Remove file extension

        try {
            await deleteFromCloudinary(publicId);
        } catch (error) {
            console.error("Error deleting old avatar from Cloudinary", error);
            throw new apiError(500, "Failed to delete old avatar");
        }

    }

    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new apiError(400, "File is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new apiError(500, "Something went wrong while uploading avatar")
    }

    const User = await user.findByIdAndUpdate(
        req.User?._id,
        {
            $set: { avatar: avatar.url }
        },
        { new: true }
    ).select("-password -refreshToken")

    return res.status(200).json(new ApiResponse(200, User, "Avatar updated successfully"))
})


const updateCoverImage = asyncHandler(async (req, res) => {
    const userId = req.User._id

    const existedUser = await user.findById(userId)
    if (!existedUser) {
        throw new apiError(404, "User not found")
    }

    const oldCoverImage = existedUser.coverImage
    if (oldCoverImage) {
        const publicId = oldCoverImage.split("/").pop().split(".")[0]
        try {
            await deleteFromCloudinary(publicId)
        } catch (error) {
            console.error("Error while deleting old cover image from clodinary", error)
            throw new apiError(500, "Failed to delete old cover image")
        }
    };

    const coverLocalPath = req.file?.path

    if (!coverLocalPath) {
        throw new apiError(400, "File is required")
    }

    const coverImage = await uploadOnCloudinary(coverLocalPath)

    if (!coverImage.url) {
        throw new apiError(500, "Something went wrong while uploading cover image")
    }

    const User = await user.findByIdAndUpdate(
        req.User?._id,
        {
            $set: { coverImage: coverImage.url }
        },
        { new: true }
    ).select("-password -refreshToken")

    return res.status(200).json(new ApiResponse(200, User, "Cover image updated successfully"))

})


const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params   // get anything from url when user is visiting

    if (!username?.trim()) {
        throw new apiError(400, "Username is required")
    }

    const channel = await user.aggregate(
        [
            {
                $match: {
                    username: username?.toLowerCase()
                }
            },
            {
                $lookup: {
                    from: "subscriptions",  //model mai saari chize lowercase aur plural mai hoti hai
                    localField: "_id",
                    foreignField: "channels",
                    as: "subscribers"
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribeTo"
                }
            },
            {
                $addFields: {
                    subscribersCount: {
                        $size: "$subscribers"
                    },

                    channelsSubscribeToCount: {
                        $size: "$subscribeTo"
                    },

                    isSubscribed: {
                        $cond: {
                            if: { $in: [req.User?._id, "$subscribers.subscriber"] },
                            then: true,
                            else: false
                        }
                    }
                }
            },

            {
                //project only neccessary data
                $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                    subscribersCount: 1,
                    channelsSubscribeToCount: 1,
                    isSubscribed: 1,
                    coverImage: 1,
                    email: 1,

                }
            }

        ]
    )


    if (!channel?.length) {
        throw new apiError(404, "Channel not found ! ")
    }

    return res.status(200).json(new ApiResponse(
        200,
        channel[0],
        "Channel profile fetched successfully"
    ))

})


const getWatchHistory = asyncHandler(async (req, res) => {
    const User = await user.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.User?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [         //to see who is the owner of video
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200).json(new ApiResponse(200, User[0].watchHistory, "Watch history fetched successfully"))
})

// delete user account
const deleteUserChannel = asyncHandler(async (req, res) => {
    const userId = req.User._id

    const existedUser = await user.findById(userId)
    if (!existedUser) {
        throw new apiError(404, "User not found")
    }

    try {
        const Avatar = existedUser.avatar
        if (Avatar) {
            const avatarpublicId = Avatar.split("/").pop().split(".")[0]
            await deleteFromCloudinary(avatarpublicId)
        }

        const CoverImage = existedUser.coverImage
        if (CoverImage) {
            const publicId = CoverImage.split("/").pop().split(".")[0]
            await deleteFromCloudinary(publicId)
        }
    } catch (error) {
        console.error("Error while deleting Avatar/CoverImage", error)
        throw new apiError(500, "Failed to delete Avatar/CoverImage")
    };

    const deleteUser = await user.findByIdAndDelete(userId)
    if (!deleteUserUser) {
        throw new apiError(500, "Failed to delete the User channel")
    }

    return res.status(200).json(new ApiResponse(200, null, "User Channel deleted successfully"));

});


export {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory,
    deleteUserChannel
}  