import Navbar from "../components/Navbar";
import CreatePost from "../components/createPost";
import SuggestedConnections from "../components/SuggestedConnections";
import "./Feed.css";
import { useState } from "react";
import { useEffect } from "react";
import {postAPI} from "../api";
import { useNavigate } from "react-router-dom";

export default function Feed() {
    const [posts,setPosts] = useState([])
    const [loading,setLoading] = useState(true)
    const [error, setError] = useState("")

    const navigate = useNavigate();


    useEffect(()=>{
        const fetchPosts = async () =>{
            try{
                let response = await postAPI.get("/")
                // console.log(response)
                setPosts(response.data)
            }catch(error){
                console.error("Failed to fetch posts:", error);
                setError("Could not load posts")
            }finally{
                setLoading(false)
            }
        }

        fetchPosts();
    },[])
    return (
        <div className="feed-container">
            <div className="feed-navbar">
                <Navbar />
            </div>

            <div className="feed-page">
                <main className="feed-main">
                    <CreatePost 
                        onPostCreated={(post)=>setPosts([post,...posts])}
                    />

                    {loading && <p>Loading posts</p>}
                    {error && <p>{error}</p>}

                    {!loading && !error && posts.length === 0 && (
                        <p>No posts yet. Create the first one!</p>
                    )}

                    {posts.map((post) => (
                        <article className="post-card" key={post._id}>

                            <button className="viewFull" onClick={()=> navigate(`/posts/${post._id}`)}>Full view the post</button>

                            <p className="post-author">Posted by: {post.author?.username || "Unknown user"}</p>
                            
                            <p>{post.content}</p>

                            {post.image && (
                                <img
                                    src={post.image}
                                    alt="Post"
                                    className="post-image"
                                />
                            )}

                            <small>
                                {new Date(post.createdAt).toLocaleString()}
                            </small>
                        </article>
                    ))}

                </main>

                <aside className="feed-sidebar">
                    <SuggestedConnections />
                </aside>
            </div>
        </div>
    );
}
