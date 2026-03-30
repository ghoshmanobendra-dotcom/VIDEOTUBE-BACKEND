import { Router } from 'express';
import {
    getVideoComments,
    addComment
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/:videoId").get(getVideoComments);
router.route("/:videoId").post(verifyJWT, addComment);

export default router;
