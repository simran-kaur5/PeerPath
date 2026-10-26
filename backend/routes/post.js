import Post from "../models/Post.js";
import express from "express"
import {StatusCodes} from 'http-status-codes'
import { validatePost } from "../middleware.js";
import multer from "multer";
import {storage} from "../cloudConfig.js"
import mongoose from "mongoose";
import { isLoggedIn,isOwner,validateBody } from "../middleware.js";

const upload = multer({ storage });

const router = express.Router()

router.post("/",isLoggedIn,validateBody,validatePost,upload.single("image"),async(req,res)=>{
    try{
        const {content} = req.body;

        if(!content || !content.trim()){
            return res.status(StatusCodes.BAD_REQUEST).json({
                message:"Post content is required"
            })
        }

        const newpost = await Post.create({
            content,
            image: req.file? req.file.path:"",
            author: req.user._id
        })

        res.status(StatusCodes.CREATED).json({
            message:"Post created sucessfully",
            post: newpost
        })
    }catch(error){
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message:"Failed to create post",
            error:error.message
        })
    }
})

router.get("/", async(req,res)=>{
    try{
        let posts = await Post.find().populate("author","username")
                                    .populate("comments.author", "username name profilePicture")
                                    .sort({createdAt:-1})

        res.status(StatusCodes.OK).json(posts)
    }catch(error){
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message:"Failed to fetch posts",
            error:error.message
        })
    }
})

router.patch("/:id/like",isLoggedIn, async(req,res)=>{
    try{
        const {id} = req.params

        if(!mongoose.isValidObjectId(id)){
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: "Invalid post ID"
            })
        }

        const post = await Post.findById(id)

        if(!post){
            return res.status(StatusCodes.NOT_FOUND).json({
                message: "Post not found"
            })
        }

        const userId = req.user._id
        const alreadyLiked = post.likes.some(//at least one id
            (likedUserId)=> likedUserId.toString() === userId.toString()
        )

        if(alreadyLiked){
            post.likes.pull(userId)
        }else{
            post.likes.addToSet(userId)
        }

        await post.save()

        return res.status(StatusCodes.OK).json({
            message: alreadyLiked? "Post unliked": "Post liked",
            likes: post.likes,
            likeCount: post.likes.length,
            isLiked: !alreadyLiked
        })
    }catch (error) {
        console.error("Like action failed:", error);

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "Failed to like or unlike post"
        })
    }
})

router.post("/:id/comments", isLoggedIn, async(req, res)=>{
    try{
        const {id} = req.params
        const {text} = req.body

        if(!mongoose.isValidObjectId(id)){
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: "Invaliu post ID"
            })
        }

        if(!text || !text.trim()){
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: "Comment cannot be empty"
            })
        }

        const post = await Post.findById(id)
        if(!post){
            return res.status(StatusCodes.NOT_FOUND).json({
                message: "Post not found"
            }) 
        }

        post.comments.push({
            text: text.trim(),
            author: req.user._id
        })

        await post.save()

        await post.populate("comments.author","username name profilePicture")

        return res.status(StatusCodes.CREATED).json({
            message: "Comment added",
            comments: post.comments
        })
    }catch (error) {
        console.error("Failed to add comment:", error);

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "Failed to add comment"
        });
    }
})

router.delete("/:id/comments/:commentId",isLoggedIn, async(req,res)=>{
    try{
        const {id, commentId} = req.params

        if(!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(commentId)){
            return res.status(StatusCodes.BAD_REQUEST).json({
                message : "Invalid post or comment ID"
            })
        }

        const post = await Post.findById(id)

        if(!post){
            return res.status(StatusCodes.NOT_FOUND).json({
                message: "Post not found"
            })
        }

        const comment = post.comments.id(commentId)

        if(!comment){
            return res.status(StatusCodes.NOT_FOUND).json({
                message: "Comment not found"
            })
        }

        if(String(comment.author) !== String(req.user._id)){
            return res.status(StatusCodes.FORBIDDEN).json({
                message: "you can only delete your own comments"
            })
        }

        comment.deleteOne()
        await post.save()

        res.status(StatusCodes.OK).json({
            message : "Comment deleted sucessfully",
            comments: post.comments
        })
    }catch(error){
        console.error("Delete comment error",error)

        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "Failed to delete comment"
        })
    }
})

router.get("/:id",async(req,res)=>{
    try{
        let id = req.params.id;
        
        const post = await Post.findById(id).populate("author","username")

        if(!post){
            return res.status(StatusCodes.NOT_FOUND).json({
                message:"Post not found"
            })
        }

        return res.json(post);
    }catch(error){
        res.status(StatusCodes.BAD_REQUEST).json({
           message:"Invalid post ID" 
        })
    }
})

router.put("/:id",isLoggedIn, isOwner,upload.single("image"),validateBody,validatePost,async(req,res)=>{
    try{
        const {id} = req.params

        if(!mongoose.isValidObjectId(id)){
            return res.status(StatusCodes.BAD_REQUEST).json({
                message:"Invalid post ID"
            });
        }

        const { content } = req.body;
        const updateData = {content}

        if(req.file){
            updateData.image = req.file.path;
        }                


        const updatedPost = await Post.findByIdAndUpdate(
            id,
            updateData,
            {new:true, runValidators:true}
        );
        
        if(!updatedPost){
            return res.status(StatusCodes.NOT_FOUND).json({
                message:"Post not Found"
            })
        }

        res.status(StatusCodes.OK).json({
            message:"Updated post",
            post:updatedPost
        })
    }catch(error){
        res.status(StatusCodes.BAD_REQUEST).json({
            message:"Failed to update post"
        })
    }
})

router.delete("/:id" ,isLoggedIn, isOwner,async (req,res)=>{
    try{
        let id = req.params.id
        let post = await Post.findByIdAndDelete(id)

        if(!post){
            return res.status(StatusCodes.NOT_FOUND).json({
                message:"Post not found"
            })
        }

        return res.status(StatusCodes.OK).json({
            message:"Post is deleted"
        })

    }catch(error){
        return res.status(StatusCodes.BAD_REQUEST).json({
            message:"Error occured"
        })
    }
})

export default router;