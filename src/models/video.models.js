import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import { user } from "./user.models.js";

const videoSchema = new Schema(
    {
        videoFile: {
            type: String,//cloudinary url
            required: true,
        },
        thumbnail: {
            type: String,//cloudinary url
            required: false, // changed to optional
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required:true,
        },
        duration: {
            type: Number,
            required:true
        },
        views: {
            type: Number,
            default:0
        },
        isPublished: {
            type: Boolean,
            default:true
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref:"user",
        }

    },
    {timestamps:true}
)

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video",videoSchema)