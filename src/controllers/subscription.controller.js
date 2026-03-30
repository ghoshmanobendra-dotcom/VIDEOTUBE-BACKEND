import { asyncHandler } from '../utils/asyncHandler.js';
import ApiResponse from '../utils/Apiresponse.js';
import { Subscription } from '../models/subscription.model.js';

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (req.user._id.toString() === channelId) {
        return res.status(400).json(new ApiResponse(400, null, "You cannot subscribe to yourself"));
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    });

    if (existingSubscription) {
        await Subscription.findByIdAndDelete(existingSubscription._id);
        return res.status(200).json(new ApiResponse(200, { isSubscribed: false }, "Unsubscribed successfully"));
    } else {
        await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
        });
        return res.status(200).json(new ApiResponse(200, { isSubscribed: true }, "Subscribed successfully"));
    }
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    const subscribers = await Subscription.find({ channel: channelId }).populate("subscriber", "fullname username avatar");
    
    return res.status(200).json(new ApiResponse(200, subscribers, "Subscribers fetched"));
});

export {
    toggleSubscription,
    getUserChannelSubscribers
};
