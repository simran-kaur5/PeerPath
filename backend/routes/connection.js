import express from "express";
import { isLoggedIn, validateBody } from "../middleware.js";
import { getConnections, sendConnectionRequest, getIncomingRequests, getSentRequests, acceptConnectionRequest, rejectConnectionRequest } from "../controllers/connectionController.js";

const router = express.Router()

router.get("/",isLoggedIn, getConnections);

router.post("/", isLoggedIn, validateBody,sendConnectionRequest)

router.get("/incoming", isLoggedIn,getIncomingRequests)

router.get("/sent", isLoggedIn, getSentRequests)


// accept the req
router.patch("/:id/accept", isLoggedIn,acceptConnectionRequest)

router.patch("/:id/reject", isLoggedIn,rejectConnectionRequest)

export default router;