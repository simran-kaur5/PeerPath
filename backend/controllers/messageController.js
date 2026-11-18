import mongoose from "mongoose";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import { StatusCodes } from "http-status-codes";

export const sendMessage = async (req, res)=>{
    try{
        const currentUserId = req.user._id
        const {conversationId, content} = req.body

        if(!mongoose.isValidObjectId(conversationId)){
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: "Invalid conversation ID"
            });
        }

        // Validate message content
        if (!content || !content.trim()) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: "Message cannot be empty"
            });
        }
        
        // Find conversation
        const conversation = await Conversation.findById(conversationId);
        
        if (!conversation) {
            return res.status(StatusCodes.NOT_FOUND).json({
                message: "Conversation not found"
            });
        }

        const isParticipant = conversation.participants.some(
            id => id.equals(currentUserId)
        )

        if(!isParticipant){
            return res.status(StatusCodes.FORBIDDEN).json({
                message: "You are not a participant in this conversation"
            }); 
        }

        const message = await Message.create({
            conversation: conversationId,
            sender: currentUserId,
            content: content.trim()
        })

        // update latest message info
        conversation.lastMessage = message._id
        conversation.lastMessageAt = message.createdAt

        await conversation.save()

        const receiverId = conversation.participants.find(
            id => !id.equals(currentUserId)
        )

        // Get Socket.io instance

        const io = req.app.get("io")

        const populatedMessage = await Message.findById(message._id).populate("sender", "username")

        // send message to receiver's personal room
        io.to(`user:${receiverId}`).emit("new-message", populatedMessage)

        return res.status(StatusCodes.CREATED).json({
            message: "Message sent successfully",
            data: populatedMessage
        })
    }catch (error) {
        console.error("Send message error:", error);

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "Unable to send message"
        });
    }
}

export const getMessages = async (req,res)=>{
    try{
        const currentUserId = req.user._id
        const {conversationId} = req.params

        // Validate conversation ID
        if (!mongoose.isValidObjectId(conversationId)) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: "Invalid conversation ID"
            });
        }

        // Find conversation
        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return res.status(StatusCodes.NOT_FOUND).json({
                message: "Conversation not found"
            });
        }

        const isParticipant = conversation.participants.some(
            id=> id.equals(currentUserId)
        )

        if(!isParticipant){
            return res.status(StatusCodes.FORBIDDEN).json({
                message: "You are not a participant in this conversation"
            });
        }

        const messages = await Message.find({
            conversation: conversationId
        }).populate("sender", "username")
        .sort({createdAt: 1})

        return res.status(StatusCodes.OK).json({
            message: "Messages fetched successfully",
            data: messages
        });
    }catch (error) {
        console.error("Get messages error:", error);

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "Unable to fetch messages"
        });
    }
}

export const markMessagesAsRead = async (req,res)=>{
    try{
        const currentUserId = req.user._id
        const {conversationId} = req.params

        if(!mongoose.isValidObjectId(conversationId)){
           return res.status(StatusCodes.BAD_REQUEST).json({
                message: "Invalid conversation ID"
            }); 
        }

        const conversation = await Conversation.findById(conversationId)

        if(!conversation){
            return res.status(StatusCodes.NOT_FOUND).json({
                message: "Conversation not found"
            });
        }

        const isParticipant = conversation.participants.some(
            id => id.equals(currentUserId)
        )

        if(!isParticipant){
            return res.status(StatusCodes.FORBIDDEN).json({
                message: "You are not a participant in this conversation"
            });
        }

        const readAt = new Date()

        const result = await Message.updateMany(
            {
                conversation: conversationId,
                sender: {$ne: currentUserId},
                readAt: null
            },
            {
                $set: {readAt}
            }
        )

        if(result.modifiedCount>0){
            const otherUserId = conversation.participants.find(
                id => !id.equals(currentUserId)
            )

            const io = req.app.get("io")

            io.to(`user:${otherUserId}`).emit("message-read",{
                conversationId,
                readerId: currentUserId.toString(),
                readAt
            })
        }
        return res.status(StatusCodes.OK).json({
            message: "Messages marked as read",
            modifiedCount: result.modifiedCount
        })
    }catch(error){
        console.error("Mark messages as read error:", error);

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "Unable to mark messages as read"
        });
    }
}

export const deleteMessage = async (req, res)=>{
    try{
        const {messageId} = req.params

        const message = await Message.findById(messageId)

        if(!message){
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Message not found"
            })
        }

        // only the sender can del their msg
        if(String(message.sender) !== String(req.user._id)){
            return res.status(403).json({
                success: false,
                message: "You can only delete your own messages"
            });
        }

        const conversationId = message.conversation;
        const conversation = await Conversation.findById(conversationId).select("participants lastMessage")

        if(!conversation){
            return res.status(404).json({
                success: false,
                message: "Conversation not found"
            });
        }

        const wasLastMessage = String(conversation.lastMessage) === String(message._id);
        const wasUnread = message.readAt === null;
        await Message.findByIdAndDelete(messageId)

        let previousMessage = null;

        if (wasLastMessage) {
            previousMessage = await Message.findOne({
                conversation: conversationId
            }).populate("sender", "username")
                .sort({ createdAt: -1 });

            await Conversation.findByIdAndUpdate(conversationId, {
                lastMessage: previousMessage?._id || null,
                lastMessageAt: previousMessage?.createdAt || null
            });
        } else {
            previousMessage = await Message.findById(conversation.lastMessage)
                .populate("sender", "username");
        }

        const io = req.app.get("io")

        conversation.participants.forEach(userId => {
            io.to(`user:${userId}`).emit("message-deleted", {
                messageId: messageId.toString(),
                conversationId: conversationId.toString(),
                lastMessage: previousMessage || null,
                wasUnread
            });
        });

        return res.status(200).json({
            success: true,
            message: "Message deleted successfully",
            data: {
                messageId,
                conversationId
            }
        }); 
    }catch(error){
        console.error("Delete message error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete message"
        }); 
    }
}