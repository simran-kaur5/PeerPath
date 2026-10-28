import { useRef, useState } from "react";
import { Avatar, Button, TextField } from "@mui/material";
import { Image, Video, CalendarDays } from "lucide-react";
import "./createPost.css";
import { postAPI } from "../../services/api.js";
import { useNavigate } from "react-router-dom";

export default function CreatePost({onPostCreated}) {
    const [postText, setPostText] = useState("");
    let fileInputRef = useRef(null)
    let [selectedImage, setSelectedImage] = useState(null)
    const [isPosting, setIsPosting] = useState(false);

    const navigate = useNavigate()

    const handlePost = async (e) => {
        e.preventDefault();
        
        if (!postText.trim()) {
            return;
        }

        setIsPosting(true);

        
        try{
            // container that holds the data you want to send from your React frontend to your backend
            const formData = new FormData()

            formData.append("content",postText.trim())

            if(selectedImage){
                formData.append("image",selectedImage)
            }

            const response = await postAPI.post("/",formData)
            onPostCreated(response.data.post)

            console.log("Post created", response.data)

            setPostText("")
            setSelectedImage(null)
        }catch(error){
            console.log("Failed to create post", error)
            if (error.response?.status === 401) {
                navigate("/login");
                return;
            }
        }finally{
            setIsPosting(false);

        }
    
    };

    let handleFileChange = (e)=>{
        const file = e.target.files[0];

        if (file) {
            setSelectedImage(file);
        }
    }


    return (
        <div className="create-post">
            <form onSubmit={handlePost} enctype="multipart/form-data">
                <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    maxRows={5}
                    placeholder="What do you want to talk about?"
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    className="create-post-input"
                />
                
                {selectedImage && (
                    <img src={URL.createObjectURL(selectedImage)} alt="Select preview" 
                    className="image-preview"/>
                )}
            

            <div className="create-post-bottom">
                <div className="create-post-options">
                    <button type="button" className="post-option" 
                    onClick={() => fileInputRef.current.click()}>

                    <Image size={20} color="#378B69" />
                    <span>Photo</span>
                </button>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileChange}
            />
                </div>

                <Button
                    variant="contained"
                    className="publish-button"
                    disabled={!postText.trim() || isPosting}
                    type="submit"
                >
                    Post
                </Button>
                </div>
            </form>
                
            
        </div>
    );
}