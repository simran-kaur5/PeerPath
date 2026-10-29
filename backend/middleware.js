import { StatusCodes } from "http-status-codes";
import postSchema from "./schemas/posts.js"
import ExpressError from "./utils.js/ExpressError.js";
import Post from "./models/Post.js";
import mongoose from "mongoose";


export const validatePost = (req,res,next)=>{
    const { error } = postSchema.validate(req.body);

    if (error) {
        const message = error.details
            .map((detail) => detail.message)
            .join(", ");

        throw new ExpressError(400, message);
    }
    next()
}

export const isLoggedIn = (req,res,next)=>{
    if(!req.isAuthenticated()){
        
        return res.status(StatusCodes.UNAUTHORIZED).json({
            message:"Please log in"
        })
    }
    next()
}

export const isOwner = async (req,res,next)=>{
    try{
        const {id} = req.params

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid post ID" });
        }

        const post = await Post.findById(id)

        if(!post){
            return res.status(StatusCodes.NOT_FOUND).json({
                message:"Post not found"
            })
        }

        if(!post.author.equals(req.user._id)){
            return res.status(403).json({
                message:"You are not allowed to modify this post"
            })
        }

        next()
    }catch(error){
        console.log(error)
        next(error)
    }
}

export const validateBody = (req,res,next)=>{
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
            message: "Request body cannot be empty"
        });
    }

    next()
}