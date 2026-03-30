import express from 'express'; 
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();
app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true
}));
app.use(express.json({limit: '10kb'}));
app.use(express.urlencoded({extended: true, limit: '10kb'}));
app.use(express.static('public'));
app.use(cookieParser());


// Routes imports
// Routes imports
import userRouter from './routes/user.routers.js';
import videoRouter from './routes/video.routers.js';
import commentRouter from './routes/comment.routers.js';
import likeRouter from './routes/like.routers.js';
import subscriptionRouter from './routes/subscription.routers.js';
import notificationRouter from './routes/notification.routers.js';

// Routes
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Videotube API is running securely! 🚀"
    });
});

app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/notifications", notificationRouter);

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        errors: err.errors || []
    });
});

export default app