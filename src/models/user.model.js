import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
const userschema = new Schema(
    {
        username:
        {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            index: true
        },

        email:
        {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },

        fullname:
        {
            type: String,
            required: true,
            trim: true,
            index: true
        },

        avatar:
        {
            type: String,
            required: true
        },

        coverImage:
        {
            type: String
        },

        watchHistory:
            [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Video"
                }
            ],

        password:
        {
            type: String,
            required: [true, "Password is required"]
        },

        refreshToken:
        {
            type: String
        }

    },

    {
        timestamps: true
    }
)

userschema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }

    this.password = await bcrypt.hash(this.password, 10);
});

userschema.methods.ispasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userschema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET || "secret",
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d" }
    )
}

userschema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET || "secret",
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "10d" }
    )
}




export const User = mongoose.model("User", userschema)
