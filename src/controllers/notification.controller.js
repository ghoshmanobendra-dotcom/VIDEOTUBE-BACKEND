import { asyncHandler } from '../utils/asyncHandler.js';
import ApiResponse from '../utils/Apiresponse.js';
import { Notification } from '../models/notification.model.js';

// Get notifications for a user
const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ recipient: req.user._id })
        .sort({ createdAt: -1 })
        .populate("sender", "fullname username avatar")
        .populate("video", "title thumbnail");

    return res.status(200).json(new ApiResponse(200, notifications, "Notifications fetched successfully"));
});

// Mark all as read
const markNotificationsAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        { recipient: req.user._id, isRead: false },
        { $set: { isRead: true } }
    );
    return res.status(200).json(new ApiResponse(200, {}, "Notifications marked as read"));
});

// Mark single as read
const markSingleNotificationAsRead = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    await Notification.findByIdAndUpdate(notificationId, { $set: { isRead: true } });
    return res.status(200).json(new ApiResponse(200, {}, "Notification marked as read"));
});

export {
    getNotifications,
    markNotificationsAsRead,
    markSingleNotificationAsRead
};
