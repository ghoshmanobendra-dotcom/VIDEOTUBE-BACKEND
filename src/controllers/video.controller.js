import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import ApiResponse from '../utils/Apiresponse.js';
import { Video } from '../models/video.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { Subscription } from '../models/subscription.model.js';
import { Comment } from '../models/comment.model.js';
import { Like } from '../models/like.model.js';
import { User } from '../models/user.model.js';
import { Notification } from '../models/notification.model.js';
import mongoose, { isValidObjectId } from "mongoose";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId, category } = req.query;
    
    const filter = { isPublished: true };
    if (userId) {
        filter.owner = userId;
    }
    if (query) {
        filter.title = { $regex: query, $options: "i" };
    }
    if (category && category.toLowerCase() !== "all") {
        filter.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    const sortOptions = {};
    if (sortBy) sortOptions[sortBy] = sortType === "asc" ? 1 : -1;

    const videos = await Video.find(filter)
        .populate("owner", "fullname username avatar")
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
        
    res.status(200).json(
        new ApiResponse(200, videos, "Videos fetched successfully")
    );
});

const getSubscribedVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;

    const subscriptions = await Subscription.find({ subscriber: req.user._id });
    const subscribedChannelIds = subscriptions.map(sub => sub.channel);
    
    const videos = await Video.find({ owner: { $in: subscribedChannelIds }, isPublished: true })
        .populate("owner", "fullname username avatar")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    res.status(200).json(new ApiResponse(200, videos, "Subscribed videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description, category } = req.body;
    
    if ([title, description].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const videoFilePath = req.files?.videoFile[0]?.path;
    const thumbnailPath = req.files?.thumbnail[0]?.path;

    if (!videoFilePath) throw new ApiError(400, "Video file is required");
    if (!thumbnailPath) throw new ApiError(400, "Thumbnail is required");

    const videoUpload = await uploadOnCloudinary(videoFilePath);
    const thumbnailUpload = await uploadOnCloudinary(thumbnailPath);

    if (!videoUpload) throw new ApiError(400, "Video file upload failed");

    const video = await Video.create({
        videoFiles: videoUpload.url,
        thumbnail: thumbnailUpload?.url || "",
        title,
        description,
        category: category || "All",
        duration: videoUpload.duration || 0,
        owner: req.user._id,
        isPublished: true
    });

    const subscribers = await Subscription.find({ channel: req.user._id });
    if (subscribers.length > 0) {
        const notificationsData = subscribers.map(sub => ({
            recipient: sub.subscriber,
            sender: req.user._id,
            video: video._id,
            message: `uploaded a new video: ${title}`
        }));
        await Notification.insertMany(notificationsData);
    }

    res.status(201).json(
        new ApiResponse(200, video, "Video published successfully")
    );
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID");
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        { $inc: { views: 1 } },
        { new: true }
    ).populate("owner", "fullname username avatar");
    
    if (!video) throw new ApiError(404, "Video not found");

    if (req.user?._id) {
        await User.findByIdAndUpdate(req.user._id, {
            $pull: { watchHistory: videoId }
        });
        await User.findByIdAndUpdate(req.user._id, {
            $push: { watchHistory: videoId }
        });
    }

    res.status(200).json(
        new ApiResponse(200, video, "Video fetched successfully")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID");
    }

    const video = await Video.findById(videoId);

    if (!video) throw new ApiError(404, "Video not found");

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission to delete this video");
    }

    await Video.findByIdAndDelete(videoId);
    await Comment.deleteMany({ video: videoId });
    await Like.deleteMany({ video: videoId });

    res.status(200).json(
        new ApiResponse(200, {}, "Video deleted successfully")
    );
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission to edit this video");
    }

    if (title) video.title = title;
    if (description) video.description = description;

    if (req.file?.path) {
        const thumbnailUpload = await uploadOnCloudinary(req.file.path);
        if (thumbnailUpload?.url) {
            video.thumbnail = thumbnailUpload.url;
        }
    }

    await video.save({ validateBeforeSave: false });

    res.status(200).json(
        new ApiResponse(200, video, "Video updated successfully")
    );
});

const reportVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    if (video.reports?.includes(req.user._id)) {
        return res.status(400).json(new ApiResponse(400, null, "You have already reported this video"));
    }

    if (!video.reports) video.reports = [];
    video.reports.push(req.user._id);

    if (video.reports.length >= 5) {
        await Video.findByIdAndDelete(videoId);
        await Comment.deleteMany({ video: videoId });
        await Like.deleteMany({ video: videoId });
        return res.status(200).json(new ApiResponse(200, { deleted: true }, "Video deleted due to multiple reports"));
    }

    await video.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, { deleted: false }, "Video reported successfully"));
});

export {
    getAllVideos,
    getSubscribedVideos,
    publishAVideo,
    getVideoById,
    deleteVideo,
    reportVideo,
    updateVideo
};
