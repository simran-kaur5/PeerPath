import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    UserRound,
    MapPin,
    BriefcaseBusiness,
    Plus
} from "lucide-react";
import { Button } from "@mui/material";
import { userAPI, postAPI,connectionAPI  } from "../../services/api";
import { useEffect } from "react";
import "./ProfileView.css";

export default function ProfileView({ user, isOwnProfile = false }) {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [posts, setPosts] = useState([]);
    const [postsLoading, setPostsLoading] = useState(true);
    const [postsError, setPostsError] = useState("");

    const [connectionStatus, setConnectionStatus] = useState("none");
    const [connectionRequestId, setConnectionRequestId] = useState(null);
    const [connectionLoading, setConnectionLoading] = useState(true);
    const [connectionActionLoading, setConnectionActionLoading] = useState(false);
    const [connectionError, setConnectionError] = useState("");

    const [profilePicture, setProfilePicture] = useState(
        user?.profilePicture || ""
    );
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");

    const [hasMorePosts, setHasMorePosts] = useState(false);
    const [nextPostCursor, setNextPostCursor] = useState(null);
    const [loadingMorePosts, setLoadingMorePosts] = useState(false);
    const [loadMorePostsError, setLoadMorePostsError] = useState("");

    const profileUserId = user?._id || user?.id;

    useEffect(()=>{
        let active = true

        const fetchUserPosts = async()=>{
            setPostsLoading(true)
            setPostsError("")
            setPosts([]);
            setHasMorePosts(false);
            setNextPostCursor(null);
            setLoadMorePostsError("");

            try{
                const response = await postAPI.get(`/author/${profileUserId}`)

                if (active) {
                    setPosts(response.data.posts || []);
                    setHasMorePosts(response.data.hasMore);
                    setNextPostCursor(response.data.nextCursor);
                }
            }catch (err) {
                if (active) {
                    setPostsError("Unable to load posts.");
                }
            }
            finally {
                if (active) {
                    setPostsLoading(false);
                }
            }
        }

        if (profileUserId) {
            fetchUserPosts();
        }else {
            setPosts([]);
            setPostsLoading(false);
            setPostsError("Unable to identify this profile.");
        }
        return () => {
            active = false;
        };  
    } ,[profileUserId])

    useEffect(()=>{
        if(isOwnProfile || !user?._id){
            setConnectionStatus("none");
            setConnectionRequestId(null);
            setConnectionLoading(false);
            setConnectionError("");
            return;
        }

        let active = true;

        const checkConnection = async () =>{
            try{
                setConnectionLoading(true);
                setConnectionError("");
                setConnectionStatus("none");
                setConnectionRequestId(null);

                const response = await connectionAPI.get(`/status/${user._id}`);

                if (!active) return;

                setConnectionStatus(response.data.status);
                setConnectionRequestId(response.data.requestId || null);
            }catch (error) {
                console.error("Connection check failed:", error);
                if (active) {
                    setConnectionError("Unable to check connection status.");
                }
            } finally {
                if (active) setConnectionLoading(false);
            }
        }

        checkConnection()

        return () =>{
            active = false
        }
    },[user?._id, isOwnProfile])

    const handleConnect = async () => {
        try {
            setConnectionActionLoading(true);
            setConnectionError("");

            await connectionAPI.post("/", {
                receiverId: user._id
            });

            setConnectionStatus("pending_sent");

        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Unable to send connection request."
            );
        } finally {
            setConnectionActionLoading(false);
        }
    };

    if (!user) return null;

    const handleProfilePictureChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("profilePicture", file);

        try {
            setUploading(true);
            setUploadError("");

            const response = await userAPI.put(
                "/me/profile-picture",
                formData
            );

            setProfilePicture(response.data.profilePicture);
        } catch (err) {
            console.error("Profile picture upload failed:", err);
            setUploadError(
                err.response?.data?.message ||
                "Unable to upload profile picture. Please try again."
            );
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const loadMoreProfilePosts = async ()=>{
        if (
            !profileUserId ||
            !hasMorePosts ||
            !nextPostCursor ||
            loadingMorePosts
        ) {
            return;
        }

        try{
            setLoadingMorePosts(true)
            setLoadMorePostsError("")

            const response = await postAPI.get(`/author/${profileUserId}`,{
                params: nextPostCursor,
            })

            setPosts(prevPosts=> [...prevPosts, ...(response.data.posts || [])])
            setHasMorePosts(response.data.hasMore)
            setNextPostCursor(response.data.nextCursor)
        }catch(error){
            console.error("Failed to load more profile posts:", error);
            setLoadMorePostsError("Unable to load more posts. Please try again.");
        } finally {
            setLoadingMorePosts(false);
        }
    }

    return (
        <>
            <div className="profile-header">
                {!isOwnProfile && !connectionLoading && (
    <>
            {connectionStatus === "none" && (
                <Button
                    variant="contained"
                    onClick={handleConnect}
                    disabled={connectionActionLoading}
                >
                    {connectionActionLoading ? "Sending..." : "Connect"}
                </Button>
            )}

            {connectionStatus === "pending_sent" && (
                <Button variant="outlined" disabled>
                    Request Sent
                </Button>
            )}

            {connectionStatus === "pending_received" && (
                <Button variant="outlined" disabled>
                    Respond to Request
                </Button>
            )}

            {connectionStatus === "connected" && (
                <Button variant="outlined" disabled>
                    Connected
                </Button>
            )}
        </>
    )}

                {connectionError && (
                    <p className="connection-error">{connectionError}</p>
                )}
                <div className="profile-avatar-wrapper">
                    <div className="profile-avatar">
                        {profilePicture ? (
                            <img
                                src={profilePicture}
                                alt={user.name || user.username}
                            />
                        ) : (
                            <UserRound size={48} />
                        )}
                    </div>

                    {isOwnProfile && (
                        <>
                            <button
                                type="button"
                                className="profile-picture-add"
                                onClick={() => fileInputRef.current?.click()}
                                title="Change profile picture"
                                disabled={uploading}
                            >
                                <Plus size={18} />
                            </button>

                            <input
                                type="file"
                                accept="image/png, image/jpeg"
                                ref={fileInputRef}
                                hidden
                                onChange={handleProfilePictureChange}
                            />
                        </>
                    )}
                </div>

                {isOwnProfile && uploading && (
                    <p>Uploading picture...</p>
                )}

                {isOwnProfile && uploadError && (
                    <p className="profile-error">{uploadError}</p>
                )}

                <h1>{user.name || user.username}</h1>
                <p className="profile-username">@{user.username}</p>

                {user.headline && (
                    <p className="profile-headline">
                        <BriefcaseBusiness size={17} />
                        {user.headline}
                    </p>
                )}

                {user.location && (
                    <p className="profile-location">
                        <MapPin size={17} />
                        {user.location}
                    </p>
                )}

    

                {isOwnProfile && (
                    <Button
                        variant="outlined"
                        className="edit-profile-btn"
                        onClick={() => navigate("/profile/edit")}
                    >
                        Edit Profile
                    </Button>
                )}
            </div>

            <section className="profile-section">
                <h2>About</h2>
                <p>{user.bio || "No bio added yet."}</p>
            </section>

            <section className="profile-section">
                <h2>Skills</h2>
                <p>
                    {user.skills?.length
                        ? user.skills.join(", ")
                        : "No skills added yet."}
                </p>
            </section>

            <section className="profile-section">
                <h2>Education</h2>
                <p>{user.education || "No education added yet."}</p>
            </section>

            {user.website && (
                <section className="profile-section">
                    <h2>Website</h2>
                    <a
                        href={user.website}
                        target="_blank"
                        rel="noreferrer"
                    >
                        {user.website}
                    </a>
                </section>
            )}

            <section className="profile-section profile-posts-section">
                <h2>Posts ({posts.length})</h2>

                {postsLoading ? (
                    <p>Loading posts...</p>
                ) : postsError ? (
                    <p className="profile-error">{postsError}</p>
                ) : posts.length === 0 ? (
                    <p>No posts yet.</p>
                ) : (
                    <div className="profile-posts-list">
                        {posts.map((post) => (
                            <article
                                className="profile-post-card"
                                key={post._id}
                                onClick={() => navigate(`/posts/${post._id}`)}
                            >
                                <p>{post.content}</p>

                                {post.image && (
                                    <img
                                        src={post.image}
                                        alt="Post"
                                        className="profile-post-image"
                                    />
                                )}

                                <div className="profile-post-stats">
                                    <span>
                                        {post.likes?.length || 0} likes
                                    </span>
                                    <span>
                                        {post.comments?.length || 0} comments
                                    </span>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                {loadMorePostsError && (
                    <p className="profile-error">
                        {loadMorePostsError}
                    </p>
                )}

                {!postsLoading && !postsError && hasMorePosts && (
                    <Button
                        variant="outlined"
                        className="load-more-profile-btn"
                        onClick={loadMoreProfilePosts}
                        disabled={loadingMorePosts}
                    >
                        {loadingMorePosts ? "Loading..." : "Load More"}
                    </Button>
                )}
            </section>
        </>
    );
}