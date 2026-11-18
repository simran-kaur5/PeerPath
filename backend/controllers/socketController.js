import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";

const notifyTyping = async (socket, io, data, eventName) => {
    try {
        const { conversationId } = data || {};
        const userId = socket.data.userId;

        if (!mongoose.isValidObjectId(conversationId)) return;

        const conversation = await Conversation.findById(conversationId);

        if (!conversation) return;

        const isParticipant = conversation.participants.some(
            id => id.toString() === userId
        );

        if (!isParticipant) return;

        const receiverId = conversation.participants.find(
            id => id.toString() !== userId
        );

        if (receiverId) {
            io.to(`user:${receiverId}`).emit(eventName, {
                conversationId,
                userId
            });
        }

        return true
    } catch (error) {
        console.error(`${eventName} error:`, error);
    }
};

export const handleTyping = (socket, io, data) => {
    return notifyTyping(socket, io, data, "user-typing");
};

export const handleStopTyping = (socket, io, data) => {
    return notifyTyping(socket, io, data, "user-stopped-typing");
};

export const notifyStoppedTyping = (socket, io, conversationId) => {
    return notifyTyping(
        socket,
        io,
        { conversationId },
        "user-stopped-typing"
    );
};