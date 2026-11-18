import express from "express";
import { isLoggedIn } from "../middleware.js";
import { createConversation, getConversations } from "../controllers/conversationController.js";

const router = express.Router()

router.post("/", isLoggedIn, createConversation)
router.get("/", isLoggedIn, getConversations)

export default router;