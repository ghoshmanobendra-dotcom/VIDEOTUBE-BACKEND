import { Router } from 'express';
import {
    toggleSubscription,
    getUserChannelSubscribers
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/c/:channelId").get(getUserChannelSubscribers);
router.route("/c/:channelId").post(verifyJWT, toggleSubscription);

export default router;
