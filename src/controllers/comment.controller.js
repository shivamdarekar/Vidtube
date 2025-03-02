import mongoose from "mongoose"
import { Comment } from "../models/comment.models.js"
import { Video } from "../models/video.models.js"
import { tweet } from "../models/tweet.models.js"
import { user } from "../models/user.models.js"
import { apiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const addVideoComment = asyncHandler(async (req, res) => {
    const { comment } = req.body;
    const { videoId } = req.params;
    const userId = req.User._id;

    if (!videoId?.trim()) {
        throw new apiError(400, "videoId is required");
    }


    if (!comment?.trim()) {
        throw new apiError(400, "comment content is empty");
    }

    try {
        const video = await Video.findById(videoId);

        if (!video) {
            throw new apiError(404, "video not found");
        }

        const newComment = await Comment.create({
            content: comment,
            video: videoId,
            owner: userId
        });

        if (!newComment) {
            throw new apiError(500, "failed to create comment")
        }

        const commentOwner = await Comment.findById(newComment._id)
            .populate("owner", "username avatar");

        return res.status(201).json(new ApiResponse(201, commentOwner, "comment added successfully"));
    } catch (error) {
        console.log("failed to add comment", error);
        throw new apiError(error.statusCode || 500, error.message || "something went wrong while adding the comment");
    }
});


const addTweetComment = asyncHandler(async (req, res) => {
    const { content } = req.body
    const { tweetId } = req.params
    const userId = req.User._id;

    if (!tweetId) {
        throw new apiError(400, "tweetId is required..")
    }

    if (!content?.trim()) {
        throw new apiError(400, "Comment content is empty")
    }

    try {
        const Tweet = await tweet.findById(tweetId);
        if (!Tweet) {
            throw new apiError(404, "Tweet not found!")
        };

        const newComment = await Comment.create({
            content,
            tweet: tweetId,
            owner: userId
        })

        if (!newComment) {
            throw new apiError(500, "Failed to create comment")
        }

        const commentOwner = await Comment.findById(newComment._id)
            .populate("owner", "username avatar")

        return res.status(200).json(new ApiResponse(200, commentOwner, "Comment created successfully"));
    } catch (error) {
        console.error("Failed to add comment", error)
        throw new apiError(error.statuscode || 500, error.message || "Something went wrong while adding a comment")
    }
});


const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { comment } = req.body;
    const userId = req.User?._id;

    if (!commentId?.trim()) {
        throw new apiError(400, "Comment ID is required");
    }
    if (!comment?.trim()) {
        throw new apiError(400, "Comment content cannot be empty");
    }

    try {
        const existingComment = await Comment.findById(commentId);

        if (existingComment.owner.toString() !== userId.toString()) {
            throw new apiError(403, "You are not authorized to update this comment");
        }

        if (!existingComment) {
            throw new apiError(404, "Comment not found");
        }


        //  Store the updated comment in a `const`
        const updatedComment = await Comment.findByIdAndUpdate(
            commentId,
            { $set: { content: comment } },
            { new: true }
        ).populate("owner", "username");


        return res.status(200).json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
    } catch (error) {
        console.error("Failed to update comment:", error);
        throw new apiError(error.statuscode || 500, error.message || "Something went wrong while updating the comment");
    }
});


const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.User?._id;

    if (!commentId?.trim()) {
        throw new apiError(400, "commentId is required")
    }

    try {
        const comment = await Comment.findById(commentId)

        if (comment.owner.toString() !== userId.toString()) {
            throw new apiError(403, "you are not authorize to delete this comment")
        }

        if (!comment) {
            throw new apiError(404, "comment not found")
        }


        const deletedComment = await Comment.findByIdAndDelete(commentId)
            .populate("owner", "username")

        return res.status(200).json(new ApiResponse(200, deletedComment, "comment deleted successfully"))

    } catch (error) {
        console.log("error while deleting the comment");
        throw new apiError(error.statuscode || 500, error.message || "something went wrong while deleting the comment")

    }
})


//If performance is a concern and the number of comments is high ➝ Use the Aggregation Approach (first version).
//If simplicity is preferred and pagination isn't required ➝ Use the Mongoose Query Approach (second version).


const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //const { page = 1, limit = 10 } = req.query;   //pagination not needed if we want all comment at a time and i want that

    if (!videoId?.trim()) {
        throw new apiError(400, "Video ID is required");
    }

    const existedVideo = await Video.findById(videoId)
    if (!existedVideo) {
        throw new apiError(404,"Video not found")
    }

    try {
        const comments = await Comment.aggregate([
            { $match: { video: new mongoose.Types.ObjectId(videoId) } }, // Filter comments for the video
            { $sort: { createdAt: -1 } }, // Sort by newest first
            {
                $lookup: {
                    from: "users", // Lookup from 'users' collection
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                },
            },
            { $unwind: "$owner" }, // Convert owner array to object
            {
                $project: {
                    _id: 1,
                    content: 1,
                    createdAt: 1,
                    // _id:"$owner._id",
                    // username:"$owner.username",  //due to this approach owner details not show in object 
                    // avatar:"$owner.avatar",
                    "owner._id": 1,
                    "owner.username": 1,
                    "owner.avatar": 1
                },
            },
            // {
            //     $skip: (page - 1) * limit  // Pagination: Skip previous pages
            // },
            // {
            //     $limit: parseInt(limit)   // Limit results
            // }
        ]);

        const totalComments = await Comment.countDocuments({ video: videoId });

        return res.status(200).json(new ApiResponse(
            200,
            {
                comments,
                totalComments,
                // page: parseInt(page),
                // limit: parseInt(limit)
            },
            "Comments fetched successfully"
        ))

    } catch (error) {
        console.error("Error fetching comments:", error);
        throw new apiError(500, "Something went wrong while fetching comments");
    }
});

// const getVideoComments = asyncHandler(async (req, res) => {
//     const { videoId } = req.params;

//     const comments = await Comment.find({ video: videoId })
//         .populate("owner", "username avatar") // Populate user info
//         .sort({ createdAt: -1 }) // Sort newest first
//         .exec();

//     return res.status(200).json(new piResponse(200, comments, "comments fetched successfully"));
// });


const getTweetComments = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    if (!tweetId) {
        throw new apiError(400, "tweetId is required..")
    }

    const existedTweet = await tweet.findById(tweetId)
    if (!existedTweet) {
        throw new apiError(404,"Tweet not found")
    }

    try {
        const comments = await Comment.aggregate([
            { $match: { tweet: new mongoose.Types.ObjectId(tweetId) } },
            { $sort: { createdAt: -1 } }, //newest comment first
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner"
                }
            },
            { $unwind: "$owner" },
            {
                $project: {
                    _id: 1,
                    content: 1,
                    createdAt:1,
                    "owner._id": 1,
                    "owner.username": 1,
                    "owner.avatar": 1
                }
            },
    
        ]);

        //const totalComments = await Comment.countDocuments({ tweet: tweetId });


        return res.status(200).json(new ApiResponse(
            200,
            {
                comments,
                totalComments: comments.length
            },
            "Comments fetched successfully"
        ));

    } catch (error) {
        console.error("Error while fetching Tweet comments",error)
        throw new apiError(error.statuscode || 500, error.message || "Something went wrong while fetching tweet comments")
    }


})



//comment on tweet done
//get all tweets comments done
//reply to comments done

export {
    addVideoComment,
    addTweetComment,
    updateComment,
    deleteComment,
    getVideoComments,
    getTweetComments

};