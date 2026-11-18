import mongoose from "mongoose";

const ConnectionSchema = new mongoose.Schema({
    participants:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    ],

    // Unique identifier for a pair of users
    participantKey: {
        type: String,
        required: true,
        unique: true
    },

    lastMessage :{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        default: null
    },

    lastMessageAt: {
        type: Date,
        default: null
    }
},
    {timestamps: true}
)

const Conversation = mongoose.model("Conversation", ConnectionSchema)

export default Conversation;