import mongoose, { isValidObjectId, mongo } from "mongoose"
import {tweet} from "../models/tweet.models.js"
import {user} from "../models/user.models.js"
import {apiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body
    const userId = req.User?._id

    if (!content?.trim()) {
        throw new apiError(400,"Tweet content is required..")
    }

    try {
        const newTweet = await tweet.create({
            content,
            owner: userId
        });

        if (!newTweet) {
            throw new apiError(400,"Failed to create new tweet")
        }

        const tweetOwner = await tweet.findById(newTweet._id)
            .populate("owner", "username avatar");
        
        return res.status(200).json(new ApiResponse(201,tweetOwner,"Tweet created successfully"))

    } catch (error) {
        console.error("Error while creating the tweet", error);
        throw new apiError(error.statusCode || 500, error.message || "Something went wrong while creating the tweet");
    }

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params
    
    if (!userId?.trim()) {
        throw new apiError(400,"userID is required..")
    }

    try {
        // const tweets = await tweet.aggregate([
        //     { $match: { owner: new mongoose.Types.ObjectId(userId) } },
        //     {
        //         $lookup: {
        //             from: "users",
        //             localField: "owner",
        //             foreignField: "_id",
        //             as: "ownerDetails",
        //             pipeline: [
        //                 {
        //                     $project: {
        //                         _id: 1,
        //                         username: 1,
        //                         avatar: 1
        //                     }
        //                 }
        //             ]
        //         }
        //     },
        //     { $unwind: "$ownerDetails" }, //  Ensure ownerDetails is an object, not an array
        //     {
        //         $project: {
        //             _id: 1,
        //             content: 1,
        //             createdAt: 1,
        //             ownerDetails: 1 // Includes user info correctly
        //         }
        //     }
        // ]);

        const tweets = await tweet.aggregate([
            { $match: { owner: new mongoose.Types.ObjectId(userId) } },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as:"ownerDetails"
                }
            },
            { $unwind: "$ownerDetails" },
            {
                $project: {
                    id: 1,
                    content: 1,
                    createdAt: 1,
                    ownerDetails: {
                        _id: 1,
                        username: 1,
                        avatar:1
                    }
                }
            }
        ])

        if (!tweets.length) {
            throw new apiError(404, "No tweets found for this user")
        }

        return res.status(200).json(new ApiResponse(200,tweets,"tweets fetched successfully"))

    } catch (error) {
        console.error("Error while fetching the tweets", error)
        throw new apiError(error.statuscode || 500, error.message || "Something went wrong while fetching the tweets");
    }
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet

    const { tweetId } = req.params;
    const { content } = req.body;
    const userId = req.User._id

    if (!tweetId?.trim()) {
        throw new apiError(400,"tweetId is required")
    }

    try {
        const existedTweet = await tweet.findById(tweetId);

        if (!existedTweet) {
            throw new apiError(404,"Tweet not found")
        }

        if (existedTweet.owner.toString() !== userId.toString()) {
            throw new apiError(403,"You are not authorize to update this tweet !")
        }

        const updatedTweet = await tweet.findByIdAndUpdate(
            tweetId,
            {$set:{content}},
            {new:true}
        ).populate("owner", "username avatar")
        
        

        return res.status(200).json(new ApiResponse(201,updatedTweet,"Tweet updated successfully"))

    } catch (error) {
        console.error("Error while updating the tweet", error)
        throw new apiError(error.statuscode || 500, error.message || "Something went wrong while updating the tweet")
    }
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params;
    const userId = req.User._id;

    if (!tweetId?.trim()) {
        throw new apiError(400,"tweetId is required")
    }

    try {
        const existedTweet = await tweet.findById(tweetId);
        if (!existedTweet) {
            throw new apiError(404,"Tweet not found")
        }

        if (existedTweet.owner.toString() !== userId.toString()) {
            throw new apiError(403,"You are not authorized to delete this tweet!")
        }

        const deleteTweet = await tweet.findByIdAndDelete(tweetId);

        return res.status(200).json(new ApiResponse(200,deleteTweet,"Tweet deleted successfully"))

    } catch (error) {
        console.error("Error while deleting the tweet", error)
        throw new apiError(error.statuscode || 500, error.message || "Something went wrong while deleting the tweet")
    }
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}