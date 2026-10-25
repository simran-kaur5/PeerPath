import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, CircularProgress } from "@mui/material";
import { ArrowLeft, Trash2 } from "lucide-react";
import {postAPI} from "../api";
import "./Delete.css";
import { StatusCodes } from "http-status-codes";

export default function DeletePost({ id }) {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleDelete = async () => {
        if (loading) return;

        setLoading(true);
        setError("");

        try {
            await postAPI.delete(`/${id}`);
            navigate("/");
        } catch (err) {

            if (err.response?.status === 401) {
                navigate("/login");
                return;
            }
            setError(
                err.response?.data?.message ||
                "Could not delete this post. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="delete-post-page">
            <div className="delete-post-card">
                <div className="delete-post-icon">
                    <Trash2 size={32} />
                </div>

                <h2>Delete Post?</h2>

                <p className="delete-post-message">
                    Are you sure you want to delete this post?
                    This action cannot be undone.
                </p>

                {error && (
                    <Alert severity="error" className="delete-post-error">
                        {error}
                    </Alert>
                )}

                <Button
                    className="confirm-delete-button"
                    variant="contained"
                    color="error"
                    fullWidth
                    disabled={loading}
                    onClick={handleDelete}
                    startIcon={
                        loading
                            ? <CircularProgress size={18} color="inherit" />
                            : <Trash2 size={18} />
                    }
                >
                    {loading ? "Deleting..." : "Yes, Delete Post"}
                </Button>

                <Button
                    className="cancel-delete-button"
                    variant="outlined"
                    fullWidth
                    disabled={loading}
                    onClick={() => navigate(-1)}
                    startIcon={<ArrowLeft size={18} />}
                >
                    Cancel
                </Button>
            </div>
        </div>
    );
}