import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const commentSchema = new Schema(
    {
        content: {
            type: String,
            required: true,
            minlength:1
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video",
            index: true
        },
        tweet: {
            type: Schema.Types.ObjectId,
            ref: "tweet",
            index: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "user",
            required: true,
            index:true
        },


    },
    {timestamps:true}
)

commentSchema.plugin(mongooseAggregatePaginate);

export const Comment = mongoose.model("Comment", commentSchema);
