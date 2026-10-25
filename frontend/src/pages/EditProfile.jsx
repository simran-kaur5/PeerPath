import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../api";
import Navbar from "../components/Navbar";
import { Button } from "@mui/material";
import "./EditProfile.css";

export default function EditProfile() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name:"",
        headline:"",
        location: "",
        bio: "",
        skills: "",
        education: "",
        website: ""
    })

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    useEffect(()=>{
        const fetchProfile = async ()=>{
            try{
                const response = await userAPI.get("/me")
            const user = response.data.user

            setFormData({
                name: user.name || "",
                headline: user.headline || "",
                location: user.location || "",
                bio: user.bio || "",
                skills: Array.isArray(user.skills)
                    ? user.skills.join(", ")
                    : user.skills || "",
                education: user.education || "",
                website: user.website || ""
            })
        }catch(error){
            console.error("Profile loading failed:", err);
            setError(err.response?.status === 401
            ? "Please log in to view your profile."
            : "Unable to load your profile. Please try again later.");
        }finally{
            setLoading(false)
        }
    }
        fetchProfile()
    },[])

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
            }));
    };

    const handleSubmit = async(e)=>{
        e.preventDefault();
        setError("");
        setSuccess("");
        setSaving(true);

        try{
            const payload = {
                ...formData,
                skills: formData.skills
                .split(",")
                .map((skill) => skill.trim())
                .filter(Boolean)
            };

            await userAPI.put("/me", payload);
            
            setSuccess("Profile updated successfully!");

            setTimeout(() => {
                navigate("/profile");
            }, 800);
        }catch (err) {
            setError(err.response?.data?.message || "Failed to update profile.")
        }finally{
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="edit-profile-page">
            <Navbar />
            <p className="edit-loading">Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="edit-profile-page">
        <Navbar />

        <div className="edit-profile-container">
            <div className="edit-profile-card">
                <h1>Edit Profile</h1>
                <p className="edit-subtitle">Update your information and let your network know you better.</p>
                <form onSubmit={handleSubmit} className="edit-profile-form">
                    <label htmlFor="name">Full Name</label>
                    <input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    />

                    <label htmlFor="headline">Professional Headline</label>
                    <input
                    id="headline"
                    name="headline"
                    value={formData.headline}
                    onChange={handleChange}
                    placeholder="e.g. Software Developer"
                    />

                    <label htmlFor="location">Location</label>
                    <input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. Ludhiana, Punjab"
                    />

                    <label htmlFor="bio">About</label>
                    <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell people about yourself"
                    rows={4}
                    />

                    <label htmlFor="skills">Skills</label>
                    <input
                        id="skills"
                        name="skills"
                        value={formData.skills}
                        onChange={handleChange}
                        placeholder="React, Node.js, MongoDB"
                    />
                    <p className="edit-hint">
                        Separate each skill with a comma.
                    </p>

                    <label htmlFor="education">Education</label>
                    <input
                        id="education"
                        name="education"
                        value={formData.education}
                        onChange={handleChange}
                        placeholder="College, degree, or qualification"
                    />

                    <label htmlFor="website">Website</label>
                    <input
                        id="website"
                        name="website"
                        type="url"
                        value={formData.website}
                        onChange={handleChange}
                        placeholder="https://example.com"
                    />

            {error && <p className="edit-error">{error}</p>}
            {success && <p className="edit-success">{success}</p>}

            <div className="edit-profile-actions">
            <Button
                type="button"
                variant="outlined"
                onClick={() => navigate("/profile")}
            >
                Cancel
            </Button>

            <Button
                type="submit"
                variant="contained"
                disabled={saving}
            >
                {saving ? "Saving..." : "Save Changes"}
            </Button>
        </div>
      </form>
    </div>
  </div>
</div>

);}