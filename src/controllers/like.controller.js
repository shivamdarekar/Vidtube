import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.models.js"
import { Video } from "../models/video.models.js"
import { Comment } from "../models/comment.models.js"
import { tweet } from "../models/tweet.models.js"
import { Reply } from "../models/reply.models.js"
import { apiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleVideoLike = asyncHandler(async (req, res) => {

    const userId = req.User?._id
    const { videoId } = req.params
    //const { removeLike } = req.body
    //TODO: toggle like on video

    if (!videoId?.trim()) {
        throw new apiError(400, "videoId is required")
    }

    const existedVideo = await Video.findById(videoId)
    if (!existedVideo) {
        throw new apiError(404,"Video not found or Deleted")
    }

    try {
        //check if the user already liked the video
        const existedlike = await Like.findOne({
            video: videoId,
            likedBy: userId
        })

        if (existedlike) {
           // if (removeLike === "true" || removeLike === true) {
           //user choose to remove liked
            await Like.findByIdAndDelete(existedlike._id);

            const totalLikes = await Like.countDocuments({ video: videoId });
            
            return res.status(200).json(new ApiResponse(
                200,
                { totalLikes },
                "liked remove successfully"
            ));
            }

            //If the user doesn't want to remove the like, return a message
            // return res.status(200).json(new ApiResponse(
            //     200,
            //     existedlike,
            //     "video is already liked"
            //))
            //}

        const newLike = await Like.create({
            video: videoId,
            likedBy: userId
        })

        
        const totalLikes = await Like.countDocuments({video:videoId})

        return res.status(200).json(new ApiResponse(
            200,
            {totalLikes},
            "video liked successfully"
        ))

    } catch (error) {
        console.log("error while toggling video like");
        throw new apiError(500, "something went wrong while toggling the like")

    }
})


const toggleCommentLike = asyncHandler(async (req, res) => {

    const userId = req.User?._id
    const { commentId } = req.params
    //const { removeLike } = req.body
    //TODO: toggle like on comment

    if (!commentId) {
        throw new apiError(400, "commentId is required")
    }

    const existedComment = await Comment.findById(commentId)
    if (!existedComment) {
        throw new apiError(404,"Comment not found or deleted")
    }

    try {
        const existedlike = await Like.findOne({
            comment: commentId,
            likedBy: userId
        })

        if (existedlike) {
            //if (removeLike === "true" || removeLike === true) {
            await Like.findByIdAndDelete(existedlike._id)

            const totalLikes = await Like.countDocuments({ comment: commentId })
            
            return res.status(200).json(new ApiResponse(
                200,
                { totalLikes },
                "Like remove successfully"
            ))
        }

        //     return res.status(200).json(new ApiResponse(
        //         200,
        //         existedlike,
        //         "Comment is already liked"
        //     ))
        // }

        const newLike = await Like.create({
            comment: commentId,
            likedBy: userId
        })

        const totalLikes = await Like.countDocuments({ comment: commentId })
        
        return res.status(200).json(new ApiResponse(
            200,
            { totalLikes },
            "Comment like successfully"
        ))
    } catch (error) {
        console.log("error while toggling comment like");
        throw new apiError(500, "Somethig went wrong while toggling the like")
        
    }

});


const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const userId = req.User._id

    if (!tweetId) {
        throw new apiError(400, "tweetId is required..")
    }

    const existedTweet = await tweet.findById(tweetId)
    if (!existedTweet) {
        throw new apiError(404,"Tweet not found or deleted")
    }

    const existedlike = await Like.findOne(
        {
            tweet: tweetId,
            likedBy: userId
        }
    );

    if (existedlike) {
        await Like.findByIdAndDelete(existedlike._id)

        const totalLikes = await Like.countDocuments({ tweet: tweetId })

        return res.status(200).json(new ApiResponse(200, { totalLikes }, "Like remove successfully"))
    }
    else {
        const newLike = await Like.create({
            tweet: tweetId,
            likedBy: userId
        });

        const totalLikes = await Like.countDocuments({ tweet: tweetId });

        return res.status(200).json(new ApiResponse(200, { totalLikes }, "Tweet like successfully"))
    }
});


const toggleReplyLike = asyncHandler(async (req, res) => {
    const { replyId } = req.params
    const userId = req.User._id
    
    if (!replyId) {
        throw new apiError(400,"replyId is required..")
    }

    const existedReply = await Reply.findById(replyId)
    if (!existedReply) {
        throw new apiError(404,"Reply not found or deleted")
    }

    const existedLike = await Like.findOne(
        {
            reply: replyId,
            likedBy: userId
        }
    );

    if (existedLike) {
        await Like.findByIdAndDelete(existedLike._id)

        const totalLikes = await Like.countDocuments({ reply: replyId });

        return res.status(200).json(new ApiResponse(200,{totalLikes},"Like remove successfully"))
    }
    else {
        const newLike = await Like.create({
            reply: replyId,
            likedBy:userId
        })

        const totalLikes = await Like.countDocuments({ reply: replyId });

        return res.status(200).json(new ApiResponse(200,{totalLikes},"Reply like successfully"))
    }
})

// const getLikedVideos = asyncHandler(async (req, res) => {
//     //get all liked videos

//     const { page = 1, limit = 10 } = req.query
//     const userId = req.User?._id // get user id

//     if (!userId) {
//         console.log("UserId is required !"); 
//     }
    
//     try {
//         const likeVideos = await Like.aggregate([
//             { $match: { likedBy: new mongoose.Types.ObjectId(userId), video: { $ne: null } } }, // Filter likes where video exists
//             {
//                 $lookup: {  //get full video details
//                     from: "videos",
//                     localField: "video",
//                     foreignField: "_id",
//                     as: "videoDetails"
//                 }
//             },
//             { $unwind: "$videoDetails" },
//             {
//                 $lookup: {  //get video owner details(creator of video)
//                     from: "users",
//                     localField: "videoDetails.owner",
//                     foreignField: "_id",
//                     as: "ownerDetails"
//                 }
//             },
//             { $unwind: "$ownerDetails" },

//             //{
//             //     $lookup: {    // Get the details of the user who liked the video
//             //         from: "users",
//             //         localField: "likedBy",  // This is the user who liked the video
//             //         foreignField: "_id",
//             //         as: "likedUser"
//             //     }
//             // },
//             // { //$unwind: "$likedUser" }, // Convert array to object
//             {
//                 $project: {
//                     _id:"$videoDetails._id",
//                     title:"$videoDetails.title",
//                     thumbnail:"$videoDetails.thumbnail",
//                     createdAt: "$videoDetails.createdAt",
//                     duration:"$videoDetails.duration",
//                     "owner._id":"$ownerDetails._id",
//                     "owner.username":"$ownerDetails.username",
//                     "owner.avatar":"$ownerDetails.avatar",
//                     // "likedUser._id": 1,
//                     // "likedUser.username": 1
//                 }
//             },
//             { $sort: { createAt: -1 } },
//             { $skip: (page - 1) * limit },
//             { $limit: parseInt(limit) }

//         ]);

//         if (!likeVideos.length) {
//             throw new apiError(500,"liked video not found..")
//         }

//         const totalLikedVideos = await Like.countDocuments({ likedBy: userId, video: { $ne: null } })
        

//         return res.status(200).json(new ApiResponse(
//             200,
//             {
//                 likeVideos,
//                 totalLikedVideos,
//                 page: parseInt(page),
//                 limit: parseInt(limit)
//             },
//             "Liked videos fetched successfully"
//         ));

//     } catch (error) {
//         console.log("Error while fetching the videos", error);
//         throw new apiError(error.statuscode || 500, error.message || "Something went wrong while fetching the videos");
        
//     }
// })


const getLikedVideos = asyncHandler(async (req, res, next) => {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.User?._id; // Get user ID

    if (!userId) {
        return next(new apiError(400, "User ID is required!"));
    }

    try {
        const likeVideos = await Like.aggregate([
            { $match: { likedBy: new mongoose.Types.ObjectId(userId), video: { $ne: null } } }, // Filter only existing videos
            
            {
                $lookup: {
                    from: "videos",
                    localField: "video",
                    foreignField: "_id",
                    as: "videoDetails",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "ownerDetails",
                                pipeline: [
                                    {
                                        $project: {
                                            _id: 1,
                                            username: 1,
                                            avatar: 1
                                        }
                                    }
                                ]
                            }
                        },
                        { $unwind: "$ownerDetails" }, // Ensure owner is an object, not an array
                        {
                            $project: {
                                _id: 1,
                                title: 1,
                                thumbnail: 1,
                                createdAt: 1,
                                duration: 1,
                                owner: "$ownerDetails" // Embed owner details inside video
                            }
                        }
                    ]
                }
            },
            { $unwind: "$videoDetails" }, // Ensure videoDetails is an object, not an array
            {
                $project: {
                    _id: "$videoDetails._id",
                    title: "$videoDetails.title",
                    thumbnail: "$videoDetails.thumbnail",
                    createdAt: "$videoDetails.createdAt",
                    duration: "$videoDetails.duration",
                    owner: "$videoDetails.owner"
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: parseInt(limit) }
        ]);

        // if (!likeVideos.length) {
        //     return next(new apiError(404, "No liked videos found"));
        // }

        const totalLikedVideos = await Like.countDocuments({ likedBy: userId, video: { $ne: null } });

        return res.status(200).json(new ApiResponse(
            200,
            {
                likeVideos,
                totalLikedVideos,
                page: parseInt(page),
                limit: parseInt(limit)
            },
            "Liked videos fetched successfully"
        ));
    } catch (error) {
        console.error("Error while fetching liked videos:", error);
        return next(new apiError(500, "Something went wrong while fetching liked videos"));
    }
});


//tweet like done
// like reply done

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    toggleReplyLike,
    getLikedVideos
}