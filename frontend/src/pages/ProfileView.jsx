import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    UserRound,
    MapPin,
    BriefcaseBusiness,
    Plus
} from "lucide-react";
import { Button } from "@mui/material";
import { userAPI } from "../api";

export default function ProfileView({ user, isOwnProfile = false }) {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [profilePicture, setProfilePicture] = useState(
        user?.profilePicture || ""
    );
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");

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

    return (
        <>
            <div className="profile-header">
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
        </>
    );
}