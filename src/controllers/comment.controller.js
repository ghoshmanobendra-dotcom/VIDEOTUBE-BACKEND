import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import ApiResponse from '../utils/Apiresponse.js';
import { Comment } from '../models/comment.model.js';

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const comments = await Comment.find({ video: videoId })
        .populate("owner", "fullname username avatar")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    return res.status(200).json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;

    if (!content) {
        throw new ApiError(400, "Content is required");
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    });

    const populatedComment = await Comment.findById(comment._id).populate("owner", "fullname username avatar");

    return res.status(201).json(new ApiResponse(201, populatedComment, "Comment added successfully"));
});

export {
    getVideoComments,
    addComment
};
