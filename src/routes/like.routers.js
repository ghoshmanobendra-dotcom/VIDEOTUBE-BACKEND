import { Router } from 'express';
import {
    toggleVideoLike,
    getVideoLikeStatus,
    getLikedVideos
} from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/videos/liked").get(verifyJWT, getLikedVideos);

router.route("/:videoId").get(verifyJWT, getVideoLikeStatus);
router.route("/:videoId").post(verifyJWT, toggleVideoLike);

export default router;
