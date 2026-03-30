import { Router } from 'express';
import {
    getNotifications,
    markNotificationsAsRead,
    markSingleNotificationAsRead
} from "../controllers/notification.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/").get(getNotifications);
router.route("/mark-read").patch(markNotificationsAsRead);
router.route("/:notificationId/read").patch(markSingleNotificationAsRead);

export default router;
