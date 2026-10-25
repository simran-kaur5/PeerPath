import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {Alert,Box,Button,CircularProgress,TextField} from "@mui/material";
import {ArrowLeft, Pencil, Save, Upload} from "lucide-react";
import {postAPI} from "../api";
import "./EditPost.css";

export default function EditPost({ id }) {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [content, setContent] = useState("");
    const [imagePreview, setImagePreview] = useState("");
    const [selectedImage, setSelectedImage] = useState(null);
    const [originalImage, setOriginalImage] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        const fetchPost = async () => {
            try {
                const response = await postAPI.get(`/${id}`);

                if (!active) return;

                setContent(response.data.content || "");

                const image = response.data.image || "";
                setOriginalImage(image);
                setImagePreview(image);
            } catch (err) {
                if (active) {
                    setError(
                        err.response?.data?.message ||
                        "Could not load this post."
                    );
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchPost();

        return () => {
            active = false;
        };
    }, [id]);

    useEffect(() => {
        if (!selectedImage) return;

        const previewUrl = URL.createObjectURL(selectedImage);
        setImagePreview(previewUrl);

        return () => URL.revokeObjectURL(previewUrl);
    }, [selectedImage]);

    const handleImageChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        if (!["image/jpeg", "image/png"].includes(file.type)) {
            setError("Please select a JPG or PNG image.");
            event.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError("Image size must be 5 MB or less.");
            event.target.value = "";
            return;
        }

        setError("");
        setSelectedImage(file);
    };

    const handleUpdate = async () => {
        if (!content.trim() || saving) return;

        setSaving(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("content", content.trim());

            if (selectedImage) {
                formData.append("image", selectedImage);
            }

            await postAPI.put(`/${id}`, formData);
            navigate("/");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Could not update this post. Please try again."
            );

            if (error.response?.status === 401) {
                navigate("/login");
                return;
            }
        } finally {
            setSaving(false);
        }
    };

    const removeSelectedImage = () => {
        setSelectedImage(null);
        setImagePreview(originalImage);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    if (loading) {
        return (
            <div className="edit-loading">
                <CircularProgress />
            </div>
        );
    }

    return (
        <div className="edit-page">
            <div className="edit-container">
                <button
                    className="edit-back-button"
                    onClick={() => navigate(-1)}
                    disabled={saving}
                >
                    <ArrowLeft size={17} />
                    Back
                </button>

                <div className="edit-heading">
                    <div className="edit-heading-icon">
                        <Pencil size={21} />
                    </div>

                    <div>
                        <h1>Edit post</h1>
                        <p>Make changes to your post.</p>
                    </div>
                </div>

                {error && (
                    <Alert
                        severity="error"
                        className="edit-error"
                        onClose={() => setError("")}
                    >
                        {error}
                    </Alert>
                )}

                <div className="edit-card">
                    <label className="edit-label" htmlFor="post-content">
                        Post content
                    </label>

                    <TextField
                        id="post-content"
                        fullWidth
                        multiline
                        minRows={5}
                        value={content}
                        onChange={(event) => setContent(event.target.value)}
                        inputProps={{ maxLength: 3000 }}
                        placeholder="What would you like to share?"
                    />

                    <div className="edit-count">
                        {content.length}/3000 characters
                    </div>

                    <div className="edit-divider" />

                    <label className="edit-label">Post photo</label>

                    {imagePreview ? (
                        <div className="edit-image-wrapper">
                            <img
                                src={imagePreview}
                                alt="Post preview"
                                className="edit-image"
                            />
                        </div>
                    ) : (
                        <div className="edit-no-image">
                            No photo added
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png"
                        hidden
                        onChange={handleImageChange}
                    />

                    <div className="edit-image-actions">
                        <Button
                            variant="outlined"
                            size="small"
                            disabled={saving}
                            startIcon={<Upload size={16} />}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Choose photo
                        </Button>

                        {selectedImage && (
                            <Button
                                size="small"
                                color="error"
                                disabled={saving}
                                startIcon={<X size={16} />}
                                onClick={removeSelectedImage}
                            >
                                Cancel photo
                            </Button>
                        )}
                    </div>

                    <p className="edit-hint">
                        JPG or PNG · Maximum 5 MB
                    </p>

                    <div className="edit-divider" />

                    <div className="edit-actions">
                        <button
                            className="edit-cancel"
                            disabled={saving}
                            onClick={() => navigate(-1)}
                        >
                            Cancel
                        </button>

                        <button
                            className="edit-save"
                            disabled={!content.trim() || saving}
                            onClick={handleUpdate}
                        >
                            {saving ? (
                                <CircularProgress
                                    size={16}
                                    color="inherit"
                                />
                            ) : (
                                <Save size={17} />
                            )}
                            {saving ? "Saving..." : "Save changes"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}