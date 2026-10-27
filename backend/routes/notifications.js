import express from "express";
import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import Notification from "../models/Notification.js";
import { isLoggedIn } from "../middleware.js";

const router = express.Router()

router.get("/",isLoggedIn, async(req,res)=>{
    try{
        const notifications = await Notification.find({
            recipient: req.user._id,
            isRead: false
        }).populate("sender","username name profilePicture")
          .populate("post","content")
          .sort({createdAt: -1})


          return res.status(StatusCodes.OK).json({notifications})
    }catch(Error){
        console.error("Fetch notifications error",Error)
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "Failed to fetch notifications"
        });
    }
})

router.get("/unread-count",isLoggedIn, async(req,res)=>{
    try{
        const count = await Notification.countDocuments({
            recipient: req.user._id,
            isRead: false
        })

        return res.status(StatusCodes.OK).json({count})
    }catch(error){
        console.error("Unread count error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "Failed to fetch unread count"
        });
    }
})

router.patch("/:id/read",isLoggedIn, async(req,res)=>{
    try{
        const {id} = req.params

        if(!mongoose.isValidObjectId(id)){
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: "Invalid notification ID"
            })
        }

        const notification = await  Notification.findOneAndUpdate({
            _id: id,
            recipient: req.user._id
            },
            {isRead: true},
            {new: true}
        )

        if(!notification){
            return res.status(StatusCodes.NOT_FOUND).json({
                message: "Notification not found"
            });
        }

        return res.status(StatusCodes.OK).json({
            message: "Notification marked as read",
            notification
        });
    }catch(error){
        console.error("Mark notification read error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "Failed to update notification"
        });
    }
})

router.patch("/read-all",isLoggedIn,async(req,res)=>{
    try{
        const result = await Notification.updateMany({
            recipient: req.user._id,
            isRead: false
            },
            {$set: {isRead: true}}
        )

        if (result.matchedCount === 0) {
            return res.status(StatusCodes.OK).json({
                message: "No unread notifications found"
            });
        }

        return res.status(StatusCodes.OK).json({
            message: "All notifications marked as read",
            modifiedCount : result.modifiedCount
        });
    }catch (error) {
        console.error("Mark all notifications read error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "Failed to update notifications"
        });
    }
})

export default router;