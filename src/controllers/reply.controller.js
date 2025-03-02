import mongoose from "mongoose";
import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Reply } from "../models/reply.models.js";
import { Comment } from "../models/comment.models.js";

const createReply = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { reply } = req.body;
    const userId = req.User._id;

    if (!commentId) {
        throw new apiError(400, "commentId is required.");
    }

    if (!reply?.trim()) {
        throw new apiError(400, "Reply is empty.");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new apiError(404, "Comment not found.");
    }

    const newReply = await Reply.create({
        reply,
        comment: commentId,
        owner: userId
    });

    if (!newReply) {
        throw new apiError(500, "Failed to add reply.");
    }

    const replyOwner = await Reply.findById(newReply._id)
        .populate("owner", "username avatar");

    return res.status(200).json(new ApiResponse(200, replyOwner, "Reply added successfully."));
});

const updateReply = asyncHandler(async (req, res) => {
    const { replyId } = req.params;
    const { reply } = req.body;
    const userId = req.User._id;

    if (!replyId) {
        throw new apiError(400, "replyId is required.");
    }

    if (!reply?.trim()) {
        throw new apiError(400, "Reply is empty.");
    }

    const existingReply = await Reply.findById(replyId);

    if (!existingReply) {
        throw new apiError(404, "Reply not found.");
    }

    if (existingReply.owner.toString() !== userId.toString()) {
        throw new apiError(403, "You are not authorized to update this reply.");
    }

    const updatedReply = await Reply.findByIdAndUpdate(
        replyId,
        { $set: { reply } },
        { new: true }
    ).populate("owner", "username avatar");

    if (!updatedReply) {
        throw new apiError(500, "Failed to update the reply.");
    }

    return res.status(200).json(new ApiResponse(200, updatedReply, "Reply updated successfully."));
});

const deleteReply = asyncHandler(async (req, res) => {
    const { replyId } = req.params;
    const userId = req.User._id;

    if (!replyId) {
        throw new apiError(400, "replyId is required.");
    }

    const existingReply = await Reply.findById(replyId);

    if (!existingReply) {
        throw new apiError(404, "Reply not found.");
    }

    if (existingReply.owner.toString() !== userId.toString()) {
        throw new apiError(403, "You are not authorized to delete this reply.");
    }

    const deletedReply = await Reply.findByIdAndDelete(replyId);

    if (!deletedReply) {
        throw new apiError(500, "Failed to delete the reply.");
    }

    return res.status(200).json(new ApiResponse(200, deletedReply, "Reply deleted successfully."));
});

const GetCommentReply = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!commentId) {
        throw new apiError(400, "commentId is required.");
    }

    try {
        const replies = await Reply.aggregate([
            { $match: { comment: new mongoose.Types.ObjectId(commentId) } },
            { $sort: { createdAt: -1 } }, // Newest first
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
                    reply: 1,
                    createdAt: 1,
                    "owner._id": 1,
                    "owner.username": 1,
                    "owner.avatar": 1 // Corrected typo
                }
            }
        ]);

        if (!replies.length) {
            throw new apiError(404, "No replies found for this comment.");
        }

        return res.status(200).json(new ApiResponse(200, replies, "Comment replies fetched successfully."));
    } catch (error) {
        console.error("Error while fetching the replies:", error);
        throw new apiError(error.statusCode || 500, error.message || "Something went wrong while fetching the comment replies.");
    }
});



export {
    createReply,
    updateReply,
    deleteReply,
    GetCommentReply
};