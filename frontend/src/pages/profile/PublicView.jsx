import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ProfileView from "./ProfileView";
import Navbar from "../../components/navigation/Navbar";
import { userAPI } from "../../services/api";
import "./PublicView.css";

export default function PublicView() {
    const { id } = useParams();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) {
            setUser(null);
            setLoading(false);
            return;
        }

        const fetchProfile = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await userAPI.get(`/${id}`);
                setUser(response.data.user);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    "Unable to load this profile"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [id]);

    return (
        <div className="public-profile-page">
            <Navbar />

            <main className="public-profile-container">
                {loading ? (
                    <p>Loading profile...</p>
                ) : error ? (
                    <p className="public-profile-error">{error}</p>
                ) : user ? (
                    <ProfileView
                        user={user}
                        isOwnProfile={false}
                    />
                ) : null}
            </main>
        </div>
    );
}
