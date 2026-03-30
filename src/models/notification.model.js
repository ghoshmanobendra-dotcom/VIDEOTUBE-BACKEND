import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
    {
        recipient: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video",
            required: true
        },
        message: {
            type: String,
            required: true
        },
        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

export const Notification = mongoose.model("Notification", notificationSchema);
