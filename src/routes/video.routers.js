import { Router } from "express";
import { getAllVideos, publishAVideo, getVideoById, getSubscribedVideos, deleteVideo, reportVideo, updateVideo } from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/").get(getAllVideos);

router.route("/subscriptions").get(verifyJWT, getSubscribedVideos);

router.route("/").post(
    verifyJWT,
    upload.fields([
        { name: "videoFile", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 },
    ]),
    publishAVideo
);

router.route("/report/:videoId").post(verifyJWT, reportVideo);

router.route("/:videoId").get(verifyJWT, getVideoById);
router.route("/:videoId").delete(verifyJWT, deleteVideo);
router.route("/:videoId").patch(verifyJWT, upload.single("thumbnail"), updateVideo);

export default router;
