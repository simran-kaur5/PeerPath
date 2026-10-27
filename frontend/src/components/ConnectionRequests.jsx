import { useEffect, useState } from "react";
import { connectionAPI } from "../api";
import Navbar from "./Navbar";
import { UserRound } from "lucide-react";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import "./ConnectionRequests.css";

export default function ConnectionRequests(){
    const [requests, setRequest] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [processingId, setProcessingId] = useState("")
    
    const navigate = useNavigate()

    const fetchRequests = async ()=>{
        try{
            const response = await connectionAPI.get("/incoming")
            setRequest(Array.isArray(response.data.requests)
                ? response.data.requests
                : []);
        }catch(error){
            console.error("Failed to fetch incoming requests:", error);
            setError(
            error.response?.data?.message || "Unable to load connection requests.");
        }finally{
            setLoading(false)
        }
    }

    useEffect(()=>{
        fetchRequests();
    },[])

    const handleAction = async (requestId, action)=>{
        try{
            setProcessingId(requestId)
            setError("")

            await connectionAPI.patch(`/${requestId}/${action}`)

            setRequest((prev) =>
                prev.filter((request) => request._id !== requestId)
            );
        } catch (err) {
            console.error("Failed to fetch requests:", err);

            setError(
                err.response?.data?.message ||
                "Unable to load connection requests."
            );
        }finally{
                    setProcessingId("")
                }
            }

    return (
        <div className="requests-page">
            <Navbar />

            <main className="requests-container">
                <h1>Connection Requests</h1>
                <p className="requests-subtitle">
                    Manage invitations from people who want to connect with you.
                </p>

                {error && <p className="requests-error">{error}</p>}

                

                {loading ? (
                <p>Loading requests...</p>
                ) : (requests || []).length === 0 ? (
                <div className="requests-empty">
                    <UserRound size={42} />
                    <h2>No pending requests</h2>
                    <p>When someone sends you a connection request, it will appear here.</p>
                </div>
                ) : ( 

                    <div className="requests-list">
                        {requests.map((request) => {
                        const sender = request.sender;

                        return (
                            <article className="request-card" key={request._id}>
                            <div
                                className="request-user"
                                onClick={() => navigate(`/people/${sender._id}`)}
                            >
                                <div className="request-avatar">
                                {sender.profilePicture ? (
                                    <img
                                    src={sender.profilePicture}
                                    alt={sender.name || sender.username}
                                    />
                  ) : (

                    <UserRound size={32} />
                  )}
                </div>

                <div>
                  <h2>{sender.name || sender.username}</h2>
                  <p>{sender.headline || "Professional member"}</p>
                </div>
              </div>
              <div className="request-actions">
                <Button
                  variant="contained"
                  disabled={processingId === request._id}
                  onClick={() => handleAction(request._id, "accept")}
                >
                  {processingId === request._id
                    ? "Processing..."
                    : "Accept"}
                </Button>

                <Button
                  variant="outlined"
                  color="inherit"
                  disabled={processingId === request._id}
                  onClick={() => handleAction(request._id, "reject")}
                >
                  Reject
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    )}
  </main>
</div>

);
}