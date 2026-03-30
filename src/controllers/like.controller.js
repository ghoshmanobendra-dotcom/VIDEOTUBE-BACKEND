import { asyncHandler } from '../utils/asyncHandler.js';
import ApiResponse from '../utils/Apiresponse.js';
import { Like } from '../models/like.model.js';

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    
    // Check if like exists
    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user._id
    });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200).json(new ApiResponse(200, { isLiked: false }, "Like removed"));
    } else {
        await Like.create({
            video: videoId,
            likedBy: req.user._id
        });
        return res.status(200).json(new ApiResponse(200, { isLiked: true }, "Like added"));
    }
});

const getVideoLikeStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    
    const likeCount = await Like.countDocuments({ video: videoId });
    
    let isLiked = false;
    if (req.user) {
        const existingLike = await Like.findOne({
            video: videoId,
            likedBy: req.user._id
        });
        isLiked = !!existingLike;
    }

    return res.status(200).json(new ApiResponse(200, { count: likeCount, isLiked }, "Like status fetched"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
    // Find all likes by the user
    const likes = await Like.find({ likedBy: req.user._id })
        .sort({ createdAt: -1 })
        .populate({
            path: "video",
            populate: {
                path: "owner",
                select: "fullname username avatar"
            }
        });

    // Extract the video objects from the like documents, filtering out any nulls if video was deleted
    const likedVideos = likes.map(like => like.video).filter(v => v);

    return res.status(200).json(new ApiResponse(200, likedVideos, "Liked videos fetched"));
});

export {
    toggleVideoLike,
    getVideoLikeStatus,
    getLikedVideos
};
