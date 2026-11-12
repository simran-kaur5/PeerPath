import express from "express"
import multer from "multer";
import {storage} from "../cloudConfig.js"
import { isLoggedIn,isOwner,validateBody,validatePost, verifyAIToken } from "../middleware.js";
import { createPost, getPosts, toggleLike, addComment, deleteComment, getPost, updatePost, deletePost, getPostsByAuthor } from "../controllers/postController.js";

const upload = multer({ storage });

const router = express.Router()

router.post("/",isLoggedIn,upload.single("image"),validateBody,validatePost,createPost);

router.get("/", getPosts)

router.post("/ai", verifyAIToken,upload.single("image"), validateBody, validatePost, createPost)

router.patch("/:id/like",isLoggedIn,toggleLike)

router.post("/:id/comments", isLoggedIn,validateBody, addComment)

router.delete("/:id/comments/:commentId",isLoggedIn,deleteComment)

router.get("/author/:userId", getPostsByAuthor);

router.get("/:id",getPost)

router.put("/:id",isLoggedIn, isOwner,upload.single("image"),validateBody,validatePost,updatePost)

router.delete("/:id" ,isLoggedIn, isOwner,deletePost)

export default router;