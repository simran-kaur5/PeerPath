import express from "express"
import multer from "multer";
import {storage} from "../cloudConfig.js"
import { isLoggedIn,isOwner,validateBody,validatePost } from "../middleware.js";
import { createPost, getPosts, toggleLike, addComment, deleteComment, getPost, updatePost, deletePost } from "../controllers/postController.js";

const upload = multer({ storage });

const router = express.Router()

router.post("/",isLoggedIn,upload.single("image"),validateBody,validatePost,createPost);

router.get("/", getPosts)

router.patch("/:id/like",isLoggedIn,toggleLike)

router.post("/:id/comments", isLoggedIn,validateBody, addComment)

router.delete("/:id/comments/:commentId",isLoggedIn,deleteComment)

router.get("/:id",getPost)

router.put("/:id",isLoggedIn, isOwner,upload.single("image"),validateBody,validatePost,updatePost)

router.delete("/:id" ,isLoggedIn, isOwner,deletePost)

export default router;