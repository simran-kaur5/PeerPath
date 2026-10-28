import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, CircularProgress } from "@mui/material";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { postAPI, userAPI } from "../../services/api";
import "./PostDetails.css"

export default function ViewFullPost({id}) {
    const navigate = useNavigate();

    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);
    const postAuthorId = post?.author?._id || post?.author;

    const isOwner = authChecked && currentUser && postAuthorId && String(postAuthorId) === String(currentUser.id);;

    useEffect(() => {
    userAPI.get("/me")
        .then((res) => setCurrentUser(res.data.user))
        .catch(() => setCurrentUser(null))
        .finally(() => setAuthChecked(true));
    }, []);

    useEffect(() => {
        let active = true;

        const fetchPost = async () => {
            try {
                const response = await postAPI.get(`/${id}`);

                if (active) {
                    setPost(response.data);
                }
            } catch (err) {
                if (active) {
                    setError(
                        err.response?.data?.message ||
                        "Could not load this post."
                    );
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        fetchPost();

        return () => {
            active = false;
        };
    }, [id]);

    if (loading) {
        return (
            <Box
                sx={{
                    minHeight: "70vh",
                    display: "grid",
                    placeItems: "center",
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (error || !post) {
        return (
            <div className="post-details-page">
                <div className="post-details-container">
                    <Alert severity="error">
                        {error || "Post not found."}
                    </Alert>

                    <button
                        className="post-back-button"
                        onClick={() => navigate("/")}
                    >
                        <ArrowLeft size={18} />
                        Back to posts
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="post-details-page">
            <div className="post-details-container">

                <button
                    className="post-back-button"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft size={18} />
                    Back
                </button>

                <div className="post-card">

                    <div className="post-card-header">
                        <p className="post-author">Posted by: {post.author?.username || "Unknown user"}</p>

                        <div className="post-menu-actions">
                            <button
                                className="post-action edit-action"
                                disabled={!isOwner}
                                onClick={() =>
                                    navigate(`/posts/${id}/edit`)
                                }
                            >
                                <Pencil size={17} />
                                Edit
                            </button>

                            <button
                                className="post-action delete-action"
                                 disabled={!isOwner}
                                onClick={() =>
                                    navigate(`/posts/${id}/delete`)
                                }
                            >
                                <Trash2 size={17} />
                                Delete
                            </button>
                        </div>
                    </div>

                    <div className="post-card-content">
                        <p>{post.content}</p>

                        {post.image && (
                            <img
                                className="post-card-image"
                                src={post.image}
                                alt="Post"
                            />
                        )}
                    </div>

                    <div className="post-details-stats">
                        <span>
                            {post.likes?.length || 0} likes
                        </span>

                        <span>
                            {post.comments?.length || 0} comments
                        </span>
                    </div>

                </div>
            </div>
        </div>
    );
}