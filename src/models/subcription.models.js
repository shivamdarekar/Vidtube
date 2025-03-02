import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
    {
        subscriber: {
            type: Schema.Types.ObjectId, //who is subscribing to user
            ref:"user"
        },
        channels: {  //user is subscribing to other channels
            type: Schema.Types.ObjectId,
            ref:"user"
        },
    },
    {timestamps:true}
)

export const subscription = mongoose.model("subscription", subscriptionSchema);