import mongoose, { isValidObjectId } from "mongoose";
import { user } from "../models/user.models.js"
import { subscription } from "../models/subcription.models.js"
import { apiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;  // Extract channel ID from request parameters
    const userId = req.User._id;  // Extract the logged-in user’s ID

    // Validate the channel ID
    if (!isValidObjectId(channelId)) {
        throw new apiError(400, "Channel ID is not valid");
    }

    if (channelId.toString() === userId.toString()) {
        throw new apiError(400, "you can not subscribe to your own channel")
    }

    // Check if the channel exists
    const channel = await user.findById(channelId);
    if (!channel) {
        throw new apiError(404, "Channel not found");
    }

    // Check if the user is already subscribed to this channel
    const subscribeExist = await subscription.findOne({ channels: channelId, subscriber: userId });

    if (subscribeExist) {
        // If subscription exists, unsubscribe (remove from the database)
        await subscription.deleteOne({ _id: subscribeExist._id });
        const totalSubscribers = await subscription.countDocuments({ subscriber: userId })
        return res.status(200).json(new ApiResponse(200, { totalSubscribers }, "Successfully unsubscribed from the channel"));
    } else {
        // If subscription does not exist, create a new subscription
        const addSubscribe = await subscription.create({ channels: channelId, subscriber: userId });
        const totalSubscribers = await subscription.countDocuments({ subscriber: userId })
        return res.status(200).json(new ApiResponse(200, { addSubscribe, totalSubscribers }, "Successfully subscribed to the channel"));
    }
});


// return subscriber list of channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    const userId = req.User._id

    if (!isValidObjectId(channelId)) {
        throw new apiError(400, "channelId is not valid")
    };

    if (channelId.toString() !== userId.toString()) {
        throw new apiError(400, "you can not view subscribers of other channels")
    }

    const channel = await user.findById(channelId);
    if (!channel) {
        throw new apiError(404, "channel not found")
    }

    try {
        const subscribers = await subscription.aggregate([
            { $match: { channels: new mongoose.Types.ObjectId(channelId) } }, // Match the subscriptions for the channel
            {
                $lookup: { // Join with users collection to get subscriber details
                    from: "users",
                    localField: "subscriber",
                    foreignField: "_id",
                    as: "subscriberDetails"
                }
            },
            { $unwind: "$subscriberDetails" }, // Convert array to object
            {
                $project: { // Select only relevant fields
                    _id: "$subscriberDetails._id",
                    username: "$subscriberDetails.username",
                    avatar: "$subscriberDetails.avatar",
                    subscribedAt: "$createdAt"
                }
            },
            { $sort: { subscribedAt: -1 } } // Sort by latest subscribers
        ]);

        // if (!subscribers.length) {
        //     throw new apiError(404, "No subscribers found for this channel")
        // }  ye condition use kiye bina bhi response mai empty array he show hoga to imp bhi nahi hai

        return res.status(200).json(new ApiResponse(
            200,
            {
                subscribers,
                totalSubscribers: subscribers.length  //length of subscribers array
            },
            "Subscribers fetched successfully"
        ));

    } catch (error) {
        console.error("Error while fetching the subscribers", error);
        throw new apiError(error.statusCode || 500, error.message || "something went wrong while fetching the subscribers")
        // return res.status(error.statusCode || 500).json(new ApiResponse(
        //     error.statusCode || 500,
        //     null,
        //     error.message || "Something went wrong"
        // ));
    }
});


// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    //const { subscriberId } = req.params;
    // only login user can fetched its subscribed channels no need to give subscriberId in params

    const userId = req.User._id;  // Get the logged-in user's ID

    if (!userId) {
        throw new apiError(401, "Unauthorized: Login required");
    };


    // if (!isValidObjectId(subscriberId)) {
    //     throw new apiError(400,"subscriberId is not valid")
    // }

    // if (subscriberId.toString() !== userId.toString()) {
    //     throw new apiError(403, "you are not authorized to get Subscribed channel list")
    // };

    const channel = await user.findById(userId);
    if (!channel) {
        throw new apiError(400, "channel not found")
    }

    try {
        const subscribedChannels = await subscription.aggregate([
            { $match: { subscriber: new mongoose.Types.ObjectId(userId) } },
            {
                $lookup: {
                    from: "users",
                    localField: "channels",
                    foreignField: "_id",
                    as: "channelDetails",
                    // pipeline: [
                    //     {
                    //         $project: {
                    //             _id: 1,
                    //             username: 1,
                    //             avatar: 1,
                    //             createdAt: 1
                    //         }
                    //     }
                    // ]
                }
            },
            { $unwind: "$channelDetails" },
            {
                $project: {
                    _id: "$channelDetails._id",
                    username: "$channelDetails.username",
                    avatar: "$channelDetails.avatar",
                    subscribedAt: "$channelDetails.createdAt",
                    //channelDetails: 1
                }
            },
            { $sort: { subscribedAt: -1 } }  //sort by latest subscribed channel
        ]);

        // if (!subscribedChannels.length) {
        //     throw new apiError(404, "No subscribed channels found for this user")
        // }

        return res.status(200).json(new ApiResponse(
            200,
            {
                subscribedChannels,
                totalSubscribedChannels: subscribedChannels.length
            },
            "Subscribed channel list fetch successfully"
        ));

    } catch (error) {
        console.error("Error while fetching the subscribed channels", error)
        return res.status(error.statusCode || 500).json(new ApiResponse(
            error.statusCode || 500,
            null,
            error.message || "Something went wrong while fetching the subscribed channels"
        ));
    }
})



export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
