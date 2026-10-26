import Navbar from "../components/Navbar";
import CreatePost from "../components/createPost";
import SuggestedConnections from "../components/SuggestedConnections";
import "./Feed.css";
import { useState } from "react";
import { useEffect } from "react";
import {postAPI, userAPI} from "../api";
import { ThumbsUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Feed() {
    const [posts,setPosts] = useState([])
    const [loading,setLoading] = useState(true)
    const [error, setError] = useState("")
    const [currentUserId, setCurrentUserId] = useState("");
    const [commentInputs, setCommentInputs] = useState({});

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

    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const response = await userAPI.get("/me");
                console.log(response.data)
                setCurrentUserId(response.data.user.id);
            } catch (error) {
                console.error("Could not fetch current user:", error);
            }
        };

        fetchCurrentUser();
    }, []);

    const handleLike = async (postId)=>{
        try{
            const response = await postAPI.patch(`/${postId}/like`)

            setPosts((prevPosts)=>
                prevPosts.map((post)=>
                    post._id === postId
                    ?{
                        ...post,
                        likes: response.data.likes
                    }:
                    post
                )
            )
        }catch (error) {
            console.error("Failed to like post:", error);
            setError("Could not like the post. Please try again.");
        }
    }

    const handleComment = async (postId)=>{
        const text = commentInputs[postId]?.trim();

        if (!text) return;

        try{
            const response = await postAPI.post(`/${postId}/comments`,{
                text
            })

            setPosts((prevPosts) =>
                prevPosts.map((post) =>
                    post._id === postId
                        ? {
                            ...post,
                            comments: response.data.comments
                        }
                        : post
                )
            );

            setCommentInputs((prev) => ({
                ...prev,
                [postId]: ""
            }));
        }catch (error) {
            console.error("Failed to add comment:", error);
            setError(
                error.response?.data?.message || "Could not add comment."
            );
        }
    }
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

                            <div className="post-actions">
                                {(() => {
                                    const likes = post.likes || [];

                                    const isLiked = likes.some(
                                        (id) => String(id._id || id) === String(currentUserId)
                                    )

                                    return (
                                        <>
                                            <button
                                                className={`like-button ${isLiked ? "liked" : ""}`}
                                                onClick={() => handleLike(post._id)}
                                            >
                                                <ThumbsUp size={18} />
                                                {isLiked ? "Liked" : "Like"}
                                            </button>

                                            <span>{likes.length} likes</span>
                                        </>
                                    );
                                })()}
                            </div>

                            <div className="post-comments">
                                <h4>Comments ({(post.comments || []).length})</h4>

                                <div className="comment-input-row">
                                    <input
                                        type="text"
                                        placeholder="Write a comment..."
                                        value={commentInputs[post._id] || ""}
                                        onChange={(e) =>
                                            setCommentInputs((prev) => ({
                                                ...prev,
                                                [post._id]: e.target.value
                                            }))
                                        }
                                    />

                                    <button onClick={() => handleComment(post._id)}>
                                        Comment
                                    </button>
                                </div>

                                {(post.comments || []).map((comment) => (
                                    <div className="comment-item" key={comment._id}>
                                        <img
                                            src={comment.author?.profilePicture || "/default-avatar.png"}
                                            alt=""
                                            className="comment-avatar"
                                        />

                                        <div>
                                            <strong>
                                                {comment.author?.name ||
                                                comment.author?.username ||
                                                "PeerPath member"}
                                            </strong>
                                            <p>{comment.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

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
