import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Connection from "../models/Connection.js";
import User from "../models/User.js";
import { StatusCodes } from "http-status-codes";
import Message from "../models/Message.js";

export const createConversation = async (req, res)=>{
    try{
        const currUserId = req.user._id;
        const {otherUserId} = req.body

        // validate the other user's ID
        if(!mongoose.isValidObjectId(otherUserId)){
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: "Invalid user ID"
            })
        }

        // prevent chatting with yourself
        if(currUserId.equals(otherUserId)){
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: "You cannot chat with yourself"
            })
        }

        const otherUser = await User.findById(otherUserId)

        if(!otherUser){
            return res.status(StatusCodes.NOT_FOUND).json({
                message: "Not found"
            })
        }

        const accepetedConnection = await Connection.findOne({
            status: "accepted",
            $or:[
                { sender: currUserId, receiver: otherUserId },
                { sender: otherUserId, receiver: currUserId }
            ]
        })

        if(!accepetedConnection){
            return res.status(StatusCodes.FORBIDDEN).json({
                message: "You can only chat with your connections"
            });
        }

        // Generate the same key regardless of who starts the chat
        const participantKey = [currUserId.toString(), otherUserId].sort().join("_")

        // check if a connection already exists
        let conversation = await Conversation.findOne({
            participantKey
        })

        // create connection if not exist
        if(!conversation){
            try{
                conversation = await Conversation.create({
                    participants: [currUserId, otherUserId],
                    participantKey
                })
            }catch(error){
                // Another simultaneous request may have created it
                if (error.code !== 11000) {
                    throw error;
                }

                conversation = await Conversation.findOne({
                    participantKey
                });
            }
        }
        conversation = await conversation.populate(
            "participants",
            "username"
        );

        return res.status(StatusCodes.OK).json({
            message: "Conversation ready",
            conversation
        })
    }catch(error){
        console.error("Create conversation error:", error)
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "Unable to create conversation"
        })
    }
}

export const getConversations = async (req,res)=>{
    try{
        const currentUserId = req.user._id

        const conversation = await Conversation.find({
            participants: currentUserId
        }).populate({path: "participants", select: "username profilePicture"})
            .populate({
            path: "lastMessage",
                select: "content sender createdAt",
                populate: {
                    path: "sender",
                    select: "username"
                }
        })
          .sort({lastMessageAt : -1})

          const unreadCounts = await Message.aggregate([
            {
                $match: {
                    conversation: {$in: conversation.map (c => c._id)},
                    sender: {$ne: currentUserId},
                    readAt: null
                }
            },
            {
                $group: {
                    _id: "$conversation",
                    count: {$sum: 1}
                }
            }
          ])

          const countMap = new Map(
            unreadCounts.map(item => [item._id.toString(), item.count])
          )

          const conversationsWithUnreadCount = conversation.map(conversation => ({
                ...conversation.toObject(),
                unreadCount: countMap.get(conversation._id.toString()) || 0
            }));

          res.status(StatusCodes.OK).json({
            success: true,
            data:conversationsWithUnreadCount
          })
    }catch(error){
        console.error("Get conversations error:",error)

        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to fetch conversations"
        })
    }
}