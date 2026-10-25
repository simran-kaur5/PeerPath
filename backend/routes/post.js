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
                                    .sort({createdAt:-1})

        res.status(StatusCodes.OK).json(posts)
    }catch(error){
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message:"Failed to fetch posts",
            error:error.message
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