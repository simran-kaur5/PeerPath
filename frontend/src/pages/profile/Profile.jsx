import { useEffect, useState } from "react";
import Navbar from "../../components/navigation/Navbar";
import ProfileView from "./ProfileView";
import { userAPI } from  "../../services/api";
import "./Profile.css";

export default function Profile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    // console.log("hi")
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                setError("");
                const response = await userAPI.get("/me");
                setUser(response.data.user);
            } catch (err) {
                console.log(err)
                setError(
                    err.response?.data?.message || "Unable to load profile"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    return (
        <div className="profile-page">
            <Navbar />

            <div className="profile-container">
                {loading ? (
                    <p>Loading Profile...</p>
                ) : error ? (
                    <p className="profile-error">{error}</p>
                ) : user ? (
                    <ProfileView
                        user={user}
                        isOwnProfile={true}
                    />
                ) : null}
            </div>
        </div>
    );
}