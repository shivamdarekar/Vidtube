import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.models.js";
import { user } from "../models/user.models.js";
import { Like } from "../models/like.models.js"
import { apiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video

    if (
        [title, description].some((field) =>
            field?.trim() === "")
    ) {
        throw new apiError(400, "Title and description are required")
    }

    const videopath = req.files?.video?.[0]?.path;
    const thumbnailpath = req.files?.thumbnail?.[0]?.path;

    if (!videopath) {
        throw new apiError(400, "Video is missing")
    }

    if (!thumbnailpath) {
        throw new apiError(400, "Thumbnail is missing")
    }

    let video, thumbnail;
    try {
        video = await uploadOnCloudinary(videopath)
        console.log("uploaded video", video);

        thumbnail = await uploadOnCloudinary(thumbnailpath)
        console.log("uploaded thumbnail", thumbnail);

    } catch (error) {
        console.log("Error while uploading video", error);
        throw new apiError(500, "Failed to upload video or thumbnail ")
    }

    try {
        const newVideo = await Video.create({
            title,
            description,
            videoFile: video.url,
            duration: video.duration,
            owner: req.User._id,
            thumbnail: thumbnail.url
        });

        const createdVideo = await Video.findById(newVideo._id)
            .select("-__v")
            .populate("owner", "username email")

        if (!createdVideo) {
            throw new apiError(500, "Failed to create video")
        }

        return res
            .status(201)
            .json(new ApiResponse(201, createdVideo, "video published successfully"))
    } catch (error) {
        console.log("failed to create video", error);

        if (video) {
            await deleteFromCloudinary(video.public_id, "video")
        }

        if (thumbnail) {
            await deleteFromCloudinary(thumbnail.public_id, "image")
        }

        throw new apiError(500, "something went wrong while creating the video")

    }
});


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if (!videoId?.trim()) {
        throw new apiError(400, "videoId is required")
    }

    try {
        const video = await Video.findById(videoId).populate("owner", "username email");

        if (!video) {
            throw new apiError(404, "video not found")
        }

        const totalLikes = await Like.countDocuments({ video: videoId });

        return res.status(200).json(new ApiResponse(200, { video, totalLikes }, "video is found"));
    } catch (error) {
        throw new apiError(500, "something went wrong while fetching the video")

    }
})


const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;
    const userId = req.User?._id;  // Get logged-in user ID

    if (!videoId?.trim()) {
        throw new apiError(400, "videoId is required");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new apiError(404, "Video not found");
    }

    // Ownership Check: Only the owner can update
    if (video.owner.toString() !== userId.toString()) {
        throw new apiError(403, "You are not authorized to update this video");
    }

    try {
        // Delete old thumbnail if it exists
        const oldThumbnail = video.thumbnail;
        if (oldThumbnail) {
            const publicId = oldThumbnail.split("/").pop().split(".")[0];
            await deleteFromCloudinary(publicId, "image");
        }
    } catch (error) {
        console.error("Error while deleting thumbnail", error);
        throw new apiError(500, "Failed to delete thumbnail");
    }

    const thumbnailPath = req.file?.path;
    console.log(thumbnailPath);
    
    if (!thumbnailPath) {
        throw new apiError(400,"File is required")
    }

    const newThumbnail = await uploadOnCloudinary(thumbnailPath, "image")
    if (!newThumbnail.url) {
        throw new apiError(500,"Failed to uodate the thumbnail")
    }

    // Update video details
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail:newThumbnail.url
            }
        },
        { new: true, runValidators: true }
    );

    return res.status(200).json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});



const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.User?._id;

    if (!videoId?.trim()) {
        throw new apiError(400, "videoId is required");
    }

    try {
        const video = await Video.findById(videoId);

        if (!video) {
            throw new apiError(404, "Video not found");
        }

        //  Ownership Check
        if (video.owner.toString() !== userId.toString()) {
            throw new apiError(403, "You are not authorized to delete this video");
        }

        // Extract Cloudinary public ID
        const videoUrl = video.videoFile;
        const publicId = videoUrl.split("/").pop().split(".")[0];
        console.log(videoUrl, publicId);

        const thumbnailUrl = video.thumbnail;
        const thumbnailPublicId = thumbnailUrl.split("/").pop().split(".")[0];

        // Delete from Cloudinary
        await deleteFromCloudinary(publicId, "video");
        await deleteFromCloudinary(thumbnailPublicId, "image");

        // Delete from MongoDB
        await Video.findByIdAndDelete(videoId);

        return res.status(200).json(new ApiResponse(200, null, "Video deleted successfully"));
    } catch (error) {
        console.error("Error while deleting video:", error);
        throw new apiError(error.statusCode || 500, error.message || "Something went wrong while deleting the video");
    }
});



const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.User?._id;

    if (!videoId?.trim()) {
        throw new apiError(400, "videoId is required");
    }

    try {
        const video = await Video.findById(videoId);

        if (!video) {
            throw new apiError(404, "Video not found");
        }

        //  Ownership Check
        if (video.owner.toString() !== userId.toString()) {
            throw new apiError(403, "You are not authorized to update this video's status");
        }

        const updatedStatus = await Video.findByIdAndUpdate(
            videoId,
            { isPublished: !video.isPublished },
            { new: true, runValidators: true }
        ).populate("owner", "username email");

        return res.status(200).json(new ApiResponse(200, updatedStatus, "Video status updated successfully"));
    } catch (error) {
        console.error("Error while updating video status", error);
        throw new apiError(error.statusCode || 500, error.message || "Something went wrong while updating the video status");
    }
});



const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, } = req.query    //sortBy, sortType, userId
    const { userId } = req.params

    if (!userId?.trim()) {
        throw new apiError(400, "userId is required")
    }

    try {
        const videos = await Video.aggregate([
            { $match: { owner: new mongoose.Types.ObjectId(userId) } },
            { $sort: { createdAt: -1 } },
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
                    title: 1,
                    thumbnail: 1,
                    createdAt: 1,
                    duration: 1,
                    "owner._id": 1,
                    "owner.username": 1,
                    "owner.avatar": 1
                }
            },
            {
                $skip: parseInt((page - 1)) * parseInt(limit)
            },
            {
                $limit: parseInt(limit)
            }
        ])

        const totalVideos = await Video.countDocuments({ owner: userId })

        return res.status(200).json(new ApiResponse(
            200,
            {
                videos,
                totalVideos,
                page: parseInt(page),
                limit: parseInt(limit)
            },
            "Videos fetched successfully"
        ))

    } catch (error) {
        console.log("Error while fetching videos", error);
        throw new apiError(500, "Something went wrong fetching the videos")

    }
})


export {
    getVideoById,
    publishAVideo,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getAllVideos
}