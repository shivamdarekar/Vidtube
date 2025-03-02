import mongoose, { isValidObjectId } from "mongoose";
import { apiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";
import { subscription } from "../models/subcription.models.js";
import { Like } from "../models/like.models.js";
import { user } from "../models/user.models.js";

const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.User._id;

    if (!isValidObjectId(userId)) {
        throw new apiError(400, "invalid user Id");
    }

    try {   //in database oprations try-catch is highly recommended
        const totalSubscribers = await subscription.countDocuments({ channels: userId });
        // if (!totalSubscribers) {
        //     throw new apiError(404, "No subscribers found for this channel");
        // }  

        //due to this error message code execution stop here and return the error message without executing the next line of code

        const totalVideos = await Video.countDocuments({ owner: userId });
        // if (!totalVideos) {
        //     throw new apiError(404, "No videos found for this channel");
        // }



        // Find all video IDs owned by the user and count total likes
        const videoIds = await Video.find({ owner: userId }).distinct("_id"); // Get video IDs
        const totalLikes = await Like.countDocuments({ video: { $in: videoIds } });


        const videoStats = await Video.aggregate([
            { $match: { owner: new mongoose.Types.ObjectId(userId) } }, // Filter by owner
            {
                $group: {
                    _id: null, // No grouping by a specific field, just sum all
                    totalViews: { $sum: "$views" } // Summing all views
                }
            }
        ]);

        // const totalViews = videoStats.length ? videoStats[0].totalViews : 0;

         const totalViews = videoStats[0]?.totalViews || 0;

        return res.status(200).json(new ApiResponse(
            200,
            {
                totalSubscribers,
                totalVideos,
                totalViews,
                totalLikes
            },
            "Channel stats fetched successfully"
        ));
    } catch (error) {
        console.error("Error while fetching channel stats", error);
        throw new apiError(500, "something went erong while fetching channel stats");
    }
});

//Video.find({ owner: userId }) → Fetch all videos owned by userId.
//.distinct("_id") → Extract only the _id field (video IDs).
//This results in an array of video IDs.

//Like.countDocuments({ video: { $in: videoIds } }) → Counts how many times these video IDs appear in the Like collection.
//$in: videoIds → Checks if video in the Like collection matches any video in videoIds.



const getChannelVideos = asyncHandler(async (req, res) => {
    //get all videos uploaded by channel..

    const userId = req.User?._id

    if (!isValidObjectId(userId)) {
        throw new apiError(400,"Invalid userId")
    };

    const videos = await Video.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(userId) } },
        {
            $project: {
                title: 1,
                videoFile: 1,
                thumbnail: 1,
                duration: 1,
                createdAt: 1
            }
        }
            
        
    ]);

    return res.status(200).json(new ApiResponse(200, videos, "User videos fetched successfully"));
})



export {
    getChannelStats,
    getChannelVideos
};