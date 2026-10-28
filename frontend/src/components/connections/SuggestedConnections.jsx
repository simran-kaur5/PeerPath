import { useEffect, useState } from "react";
import { Avatar, Button } from "@mui/material";
import { UserPlus, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { userAPI, connectionAPI } from "../../services/api";
import "./SuggestedConnections.css";

export default function SuggestedConnections(){
    const [people, setPeople] = useState([])
    const [sentRequests, setSentRequests] = useState([])
    const [loading, setLoading] = useState(true)

    const [requestingId, setRequestingId] = useState("")
    const [error, setError] = useState("")

    const navigate = useNavigate()

    useEffect(()=>{
        const fetchSuggestions = async ()=>{
            try{
                const [userRes, sentRes] = await Promise.all([
                    userAPI.get("/"),
                    connectionAPI.get("/sent")
                ]) 

                setPeople(userRes.data.users || [])

                setSentRequests(
                    (sentRes.data.requests || []).map(
                        (request) => request.receiver._id
                    )
                );
            }catch(error){
                console.error("Failed to load sugeestions", error)
                setError(error.response?.data?.message ||
                    "Unable to load suggestions.")
            }finally{
                setLoading(false)
            }
        }
        fetchSuggestions()
    },[])

    const handleConnect = async (personId) =>{
        try{
            setRequestingId(personId)
            setError("")

            await connectionAPI.post("/",{
                receiverId: personId
            })

            setSentRequests((prev)=> [...prev, personId])
        }catch(err){
            console.error("Failed to send connection request:", err);
            setError(
                err.response?.data?.message ||
                "Unable to send connection request."
            );
        } finally {
            setRequestingId("")
        }
    }
    if (loading) {
        return <div className="suggested-card">Loading suggestions...</div>;
    }

    return (
        <div className="suggested-card">
            <div className="suggested-header">
                <div>
                    <h2>People you may know</h2>
                    <p>Grow your professional network</p>
                </div>

                <div className="suggested-icon">
                    <Users size={21} />
                </div>
            </div>

            {error && <p className="suggested-error">{error}</p>}


            <div className="suggested-list">
            {people.slice(0, 4).map((person) => (
                <div className="suggested-person" key={person._id}>
                    <Avatar
                        className="suggested-avatar"
                        src={person.profilePicture || undefined}
                    >
                        {!person.profilePicture &&
                            (person.name || person.username || "U")

                            .charAt(0)
                                .toUpperCase()}
                    </Avatar>

                    <div className="suggested-person-info">
                        <h3>{person.name || person.username}</h3>

                        <p className="suggested-role">
                            {person.headline || "PeerPath member"}
                        </p>

                        <Button
                            variant="outlined"
                            size="small"
                            className="connect-button"
                            startIcon={<UserPlus size={15} />}
                            disabled={
                                requestingId === person._id ||
                                sentRequests.includes(person._id)
                            }
                            onClick={() => handleConnect(person._id)}
                        >
                            {requestingId === person._id
                                ? "Sending..."
                                : sentRequests.includes(person._id)
                                ? "Request Sent"
                                : "Connect"}
                        </Button>
                    </div>
                </div>
            ))}

            {people.length === 0 && (
                <p>No new people to suggest right now.</p>
            )}
        </div>
        {!error && (
            <button
                className="see-all-connections"
                onClick={() => navigate("/people")}
            >
                Show all suggestions
                <span>→</span>
            </button>
        )}
        
    </div>
);

}