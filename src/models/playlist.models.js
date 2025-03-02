import mongoose, { Schema } from "mongoose";
//import { Video } from "./video.models.js";

const playlistSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        videos: [
            {
                type: Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        owner: {
            type: Schema.ObjectId,
            ref:"user"
        },
        isPublished: {
            type: Boolean,
            default:true
        }
    },
    {timestamps:true}
)


export const playlist = mongoose.model("playlist",playlistSchema)