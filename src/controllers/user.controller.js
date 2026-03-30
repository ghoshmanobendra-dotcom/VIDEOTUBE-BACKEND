import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import ApiResponse from '../utils/Apiresponse.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const AccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError(500, "Error generating tokens")
    }
}

const registerUser = asyncHandler(async (req, res) => {

    const { username, email, fullname, password } = req.body
    console.log(req.body)

    if (!username || !email || !fullname || !password) {
        throw new ApiError(400, "All fields are required")
    }

    const userExists = await User.findOne({
        $or: [
            { email: email },
            { username: username }
        ]
    })

    if (userExists) {
        throw new ApiError(400, "User already exists with the provided email or username")
    }

    const avatarLocalpath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalpath || !coverImageLocalPath) {
        throw new ApiError(400, "Avatar and cover image are required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalpath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar || !coverImage) {
        throw new ApiError(500, "Error uploading images to cloudinary")
    }

    const user = await User.create({
        username: username.toLowerCase(),
        email,
        password,
        fullname,
        avatar: avatar.url,
        coverImage: coverImage.url
    })

    const createuser = await User.findById(user._id).select("-password -refreshToken")
    if (!createuser) {
        throw new ApiError(500, "Error creating user")
    }

    const { accessToken, refreshToken } = await AccessAndRefreshTokens(createuser._id)

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, {
            user: createuser,
            accessToken,
            refreshToken
        }, "User registered successfully"))
})

const loginUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if (!(email || username)) {
        throw new ApiError(400, "Email or username is required");
    }
    const conditions = [];
    if (email) conditions.push({ email });
    if (username) conditions.push({ username });

    const user = await User.findOne({ $or: conditions });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.ispasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } = await AccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged in successfully"
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: null
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, "USER LOGGED OUT"))

})


const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(400, "Refresh token is required");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        if (decodedtoken !== user.refreshToken) {
            throw new ApiError(401, "Invalid refresh token");
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newrefreshToken } = await AccessAndRefreshTokens(user._id)
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newrefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        newrefreshToken
                    },
                    "Access token refreshed successfully"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {

    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user._id)

    const isOldPasswordValid = await user.ispasswordCorrect(oldPassword)

    if (!isOldPasswordValid) {
        throw new ApiError(401, "Old password is incorrect")
    }
    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, "Password changed successfully"))

})
const CurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body
    if (!fullname || !email) {
        throw new ApiError(401, "All Feilds are required")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname: fullname,
                email: email
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(200, user, "Account details are updated")
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatrLocalPath = req.file?.path
    if (!avatrLocalPath) {
        throw new ApiError(400, "Avatar is missing")
    }

    const avatar = await uploadOnCloudinary(avatrLocalPath)

    if (!avatar.url) {
        throw new ApiError(500, "Error while uploading avatar")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(200, user, "Avatar is updated")

})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(500, "Error while uploading cover image")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(200, user, "Cover image is updated")

})

const getUserChannelProfile = asyncHandler(async (req, res) => {

    const { username } = req.params

    if (!username) {
        throw new ApiError(400, "Username is required")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                subscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {
                            $in: [req.user?._id, "$subscribers.subscriber"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount: 1,
                subscribedToCount: 1,
                isSubscribed: 1,
                email: 1,
                createdAt: 1,
            }
        }
    ])
    console.log(channel)
    if(!channel.length){
        throw new ApiError(404, "Channel not found")
    }

    return res
        .status(200)
        .json(
           new ApiResponse(200, channel[0], "Channel profile fetched successfully")
        )
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate({
        path: "watchHistory",
        populate: {
            path: "owner",
            select: "fullname username avatar"
        }
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, user.watchHistory, "Watch history fetched successfully")
        );
});

const searchUsers = asyncHandler(async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(200).json(new ApiResponse(200, [], "Empty query"));
    }

    const users = await User.aggregate([
        {
            $match: {
                $or: [
                    { username: { $regex: query, $options: "i" } },
                    { fullname: { $regex: query, $options: "i" } }
                ]
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $addFields: {
                subscribersCount: { $size: "$subscribers" },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                avatar: 1,
                subscribersCount: 1,
                isSubscribed: 1
            }
        }
    ]);

    return res.status(200).json(new ApiResponse(200, users, "Users found"));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    CurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
    searchUsers
}