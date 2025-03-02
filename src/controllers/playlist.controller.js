import express from 'express';
import mongoose, { isValidObjectId } from "mongoose";
import { apiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { playlist } from "../models/playlist.models.js"
import { Video } from '../models/video.models.js';

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    const userId = req.User?._id
    
    if (!name) {
        throw new apiError(400, "Playlist name is required..");
    }

    const existedPlaylist = await playlist.findOne({ name, owner: userId });
    if (existedPlaylist) {
        throw new apiError(400, "you already have playlist with this name")
    }

    try {
        // const existedPlaylist = await playlist.findOne({ name, owner: userId });
        // if (existedPlaylist) {
        //     throw new apiError(400, "you already have playlist with this name")
        // }

        //create new playlist
        const newPlaylist = await playlist.create({
            name,
            description,
            owner: userId,
            videos: []
        });

        if (!newPlaylist) {
            throw new apiError(404, "failed to create new playlist")
        }

        return res.status(200).json(new ApiResponse(
            200,
            newPlaylist,
            "Playlist created successfully"
        ))


    } catch (error) {
        
        console.log("Error while creating the playlist", error);
        throw new apiError(error.statuscode || 500, error.message || "Something went wrong while creating the playlist");
        
    }
});


const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Validate user ID
    if (!isValidObjectId(userId)) {
        throw new apiError(400, "User ID is not valid");
    }

    const userPlaylist = await playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "playlistOwner"
            }
        },
        { $unwind: "$playlistOwner" },
        {
            $project: {
                name: 1,
                description: 1,
                videos: 1, // Only include video IDs
                totalvideos:{$size:"$videos"},
                owner: {
                    _id: "$playlistOwner._id",
                    username: "$playlistOwner.username",
                    avatar: "$playlistOwner.avatar"
                }
            }
        },
        // {
        //     $addFields: {
        //         totalVideos: { $size: "$videos" } // Count total videos
        //     }
        // }
    ]);

    if (!userPlaylist.length) {
        throw new apiError(404, "User playlist doesn't exist");
    }

    return res.status(200).json(new ApiResponse(200, userPlaylist, "Successfully fetched the user playlist"));
});






const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!playlistId) {
        throw new apiError(400, "playlistId is required.");
    }

    try {
        // Fetch playlist along with video and owner details
        const getplaylist = await playlist
            .findById(playlistId)
            .populate("videos", "title thumbnail duration views")
            .populate("owner", "username avatar"); // Fetch owner details in the same query

        if (!getplaylist) {
            throw new apiError(404, "Playlist not found");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, getplaylist, "Playlist found successfully"));
    } catch (error) {
        console.error("Error while fetching the playlist", error);
        throw new apiError(500, "Something went wrong while fetching the playlist");
    }
});



const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    const userId = req.User._id
    
    if (!playlistId || !videoId) {
        throw new apiError(400, "playlistId and videoId is required..")
    }

    try {
        const Playlist = await playlist.findById(playlistId);

        if (!Playlist) {
            throw new apiError(404, "playlist not found");
        }

        if (Playlist.owner.toString() !== userId.toString()) {
            throw new apiError(403,"You are not authorized to Add video in playlist")
        };


        const existedVideo = await Video.findById(videoId)
        if (existedVideo) {
            throw new apiError(404, "video not found")
        }

        if (Playlist.videos.includes(videoId)) {
            throw new apiError(400,"video already existes in the playlist")
        };


        const existedPlaylist = await playlist.findByIdAndUpdate(playlistId,
            { $addToSet: { videos: videoId } },   //push allows duplicates, addToSet doesn't allow duplicates
            { new: true }
        );

        
            // existedplaylist.videos.push(videoId);
            // await existedplaylist.save();

        return res.status(200).json(new ApiResponse(200, existedPlaylist, "video added to playlist successfully"));

        
    }
    catch (error) {
            console.error("Error while adding the video to playlist", error);
            throw new apiError(error.statuscode || 500, error.message || "something went wrong while adding the video to playlist")
        }
    });


const deleteVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    const userId = req.User._id
    
    if (!playlistId || !videoId) {
        throw new apiError(400,"playlistId and videoId is required..")
    }

    try {
        const existedVideo = await Video.findById(videoId)
        const Playlist = await playlist.findById(playlistId)

        if (Playlist.owner.toString() !== userId.toString()) {
            throw new apiError(403,"You are not authorized to delete video from playlist")
        }

        if(!existedVideo) {
            throw new apiError(404, "video not found")
        }

        const existedPlaylist = await playlist.findByIdAndUpdate(playlistId,
            { $pull: { videos: videoId } },   // $pull removes the video from the playlist
            { new: true }
        );

        if (!existedPlaylist) {
            throw new apiError(404, "playlist not found");
        }

        return res.status(200).json(new ApiResponse(200, existedPlaylist, "video removed from playlist successfully"))

    } catch (error) {
        console.error("Error while removing the video from playlist", error);
        throw new apiError(error.statuscode || 500, error.message || "something went wrong while removing the video from playlist")
    }
})


const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    const userId = req.User?._id
    
    if (!playlistId) {
        throw new apiError(400, "playlistId is required..")
    }

    try {
        const getplaylist = await playlist.findById(playlistId);

        if (!getplaylist) {
            throw new apiError(404, "playlist not found");
        }

        if (getplaylist.owner.toString() !== userId.toString()) {
            throw new apiError(403, "You are not authorized to update the playlist")
        }

        const updatePlaylist = await playlist.findByIdAndUpdate(playlistId,
            { $set: { name, description } },
            { new: true }
        );

        return res.status(200).json(new ApiResponse(200, updatePlaylist, "playlist updated successfully"))

    } catch (error) {
        console.error("Error while updateing the playlist", error);
        throw new apiError(error.statuscode || 500, error.message || "Something went wrong while updating the playlist")
    }
});

const toggleStatus = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const userId = req.User._id

    if (!playlistId) {
        throw new apiError(400,"PlaylistId is required..")
    }

    const Playlist = await playlist.findById(playlistId)
    if (!Playlist) {
        throw new apiError(404,"Playlist not found")
    }

    if (Playlist.owner.toString() !== userId.toString()) {
        throw new apiError(403,"You are not authorized to toggle status of playlist")
    }

    const updateStatus = await playlist.findByIdAndUpdate(
        playlistId,
        {
            isPublished: !Playlist.isPublished
        },
        { new: true, runValidators: true }
    );

    return res.status(200).json(new ApiResponse(200,updateStatus,"Playlist status updated successfully"))
})

//user Authentication done

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    deleteVideoFromPlaylist,
    updatePlaylist,
    toggleStatus
}