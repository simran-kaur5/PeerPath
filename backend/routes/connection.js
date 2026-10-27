import express from "express";
import mongoose from "mongoose";
import Connection from "../models/Connection.js";
import User from "../models/User.js";
import { isLoggedIn } from "../middleware.js";
import { StatusCodes } from "http-status-codes";
import Notification from "../models/Notification.js"

const router = express.Router()

router.get("/",isLoggedIn, async(req,res)=>{
    try{
        const connections = await Connection.find({
            status : "accepted",
            $or: [
                {sender: req.user._id},
                {receiver : req.user._id}
            ]
        }).populate("sender","username name headline profilePicture  location")
        .populate("receiver", "username name headline profilePicture location")

        const users = connections.map((connection)=>{
            return connection.sender._id.toString() === req.user._id.toString()? 
            connection.receiver
            : connection.sender
        })

        res.status(200).json({ connections: users });
    }
    catch (error) {
        console.error("Failed to fetch connections:", error);
        res.status(500).json({
            message: "Unable to load connections."
        });
    }
});

router.post("/", isLoggedIn, async (req, res)=>{
    try{
        const {receiverId} = req.body || {}
        const senderId = req.user._id

        if(!mongoose.isValidObjectId(receiverId)){
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: "Valid recevier ID is required"
            })
        }

        if(senderId.equals(receiverId)){
            return res.status(StatusCodes.BAD_REQUEST).json({
                message :"You cannot connect with yourself"
            })
        }

        const receiver = await User.findById(receiverId)

        if(!receiver){
            return res.status(StatusCodes.NOT_FOUND).json({
                message: "User not found"
            })
        }

        const existingRequest = await Connection.findOne({
            $or : [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId }
            ]
        })

        if (existingRequest) {
            // A pending request already exists
            if (existingRequest.status === "pending") {
                return res.status(409).json({
                    message: "A connection request is already pending"
                });
            }

            // Already connected
            if (existingRequest.status === "accepted") {
                return res.status(409).json({
                    message: "You are already connected"
                });
            }

            // A previous request was rejected: allow the original sender to retry
            if (
                existingRequest.status === "rejected" &&
                String(existingRequest.sender) === String(senderId)
            ) {
                existingRequest.status = "pending";
                await existingRequest.save();

                await Notification.create({
                    recipient: receiverId,
                    sender: senderId,
                    type: "connection_request",
                    message: `${req.user.name || "Someone"} sent you a connection request`
                })

                return res.status(200).json({
                    message: "Connection request sent again",
                    request: existingRequest
            });

            }

            return res.status(StatusCodes.CONFLICT).json({
                message: "A connection request already exists"
            });
        }

        const request = await Connection.create({
            sender : senderId,
            receiver : receiverId
        })

        await Notification.create({
            recipient: receiverId,
            sender: senderId,
            type: "connection_request",
            message: `${req.user.name || "Someone"} sent you a connection request`
        })

        return res.status(StatusCodes.OK).json({
            message : "Connection request sent",
            request
        })
    }catch(error){
        console.error("Send connection req failed", error)
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message :"Unable to send a connection req"
        })
    }
})

router.get("/incoming", isLoggedIn, async(req,res)=>{
    try{
        const requests = await Connection.find({
            receiver : req.user._id,
            status : "pending"
        }).populate("sender", "username name headline profilePicture")

        return res.status(StatusCodes.OK).json({requests})
    }catch(error){
        console.error(error)
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message : "Unable to fetch incoming requests"
        })
    }
})

router.get("/sent", isLoggedIn, async(req,res)=>{
    try{
        const requests = await Connection.find({
            sender : req.user._id,
            status : "pending"
        }).populate("receiver", "username name headline profilePicture")

        return res.status(StatusCodes.OK).json({requests})
    }catch(error){
        console.error(error)
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message : "Unable to fetch sent requests"
        })
    }
})


// accept the req
router.patch("/:id/accept", isLoggedIn, async (req, res)=>{
    try{
        if(!mongoose.isValidObjectId(req.params.id)){
            return res.status(StatusCodes.BAD_REQUEST).json({
                message : "Invalid request ID"
            })
        }

        const request = await Connection.findOne({
            _id : req.params.id, // connection id
            receiver : req.user._id,
            status : "pending"
        })

        if(!request){
            return res.status(StatusCodes.NOT_FOUND).json({
                message : "Pending incoming req not found"
            })
        }

        request.status = "accepted"

        await request.save()

        return res.status(StatusCodes.OK).json({
            message : "Connection request accpeted",
            request
        })
    }catch(error){
        console.log(error)

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message : "Unable to accept request",
        })
    }
})

router.patch("/:id/reject", isLoggedIn,  async(req,res)=>{
    try{
        if(!mongoose.isValidObjectId(req.params.id)){
            return res.status(StatusCodes.BAD_REQUEST).json({
                message : "Invalid request ID"
            })
        }

        const request = await Connection.findOne({
            _id : req.params.id,
            receiver : req.user._id,
            status : "pending"

        })

        if(!request){
            return res.status(StatusCodes.NOT_FOUND).json({
                message : "Pending incoming req not found"
            })
        }

        request.status = "rejected"

        await request.save()
        
        return res.status(StatusCodes.OK).json({
            message: "Connection request rejected",
            request
        })
    }catch(error){
        console.log(error)
        return res.status(StatusCodes.BAD_REQUEST).json({
            message : "Unable to reject request"
        })
    }
})

export default router;