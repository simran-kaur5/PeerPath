import express from "express";
import { isLoggedIn } from "../middleware.js";
import { getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead } from "../controllers/notificationController.js";

const router = express.Router()

router.get("/",isLoggedIn, getNotifications)

router.get("/unread-count",isLoggedIn, getUnreadCount)

router.patch("/:id/read",isLoggedIn, markNotificationRead)

router.patch("/read-all",isLoggedIn, markAllNotificationsRead)

export default router;