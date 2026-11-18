import express from "express";
import { isLoggedIn } from "../middleware.js";
import { sendMessage, getMessages, markMessagesAsRead, deleteMessage} from "../controllers/messageController.js";

const router = express.Router();

router.post("/", isLoggedIn, sendMessage);
router.get("/:conversationId", isLoggedIn, getMessages);
router.patch("/:conversationId/read", isLoggedIn, markMessagesAsRead);
router.delete("/:messageId", isLoggedIn, deleteMessage);

export default router;
