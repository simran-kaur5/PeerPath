import mongoose from "mongoose"

const PostSchema = new mongoose.Schema({
    content:{
        required:true,
        type: String,
        trim: true,
        maxLength:3000,
    },

    image:{
        type: String,
        default:""
    },

    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required : true
    },

    likes:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],

    comments: [
        {
            text: {
                type: String, 
                required: true,
                trim: true
            },
            author: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            },
            createAt:{
                type: Date,
                default: Date.now
            }
        }
    ]
},
{
        timestamps:true
})

const Post = mongoose.model("Post",PostSchema)

export default Post;