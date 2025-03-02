import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const replySchema = new Schema(
    {
        reply: {
            type: String,
            required: true,
            minlength:1
        },
        comment: {
            type: Schema.Types.ObjectId,
            ref: "Comment",
            index: true,
            required:true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "user",
            required: true,
            index:true
        }

    },
    {timestamps:true}
)

replySchema.plugin(mongooseAggregatePaginate);

export const Reply = mongoose.model("Reply", replySchema);