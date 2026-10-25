import { useEffect, useState } from "react";
import { userAPI } from "../api";
import Navbar from "./Navbar";
import { UserRound, MapPin } from "lucide-react";
import "./People.css";
import { useNavigate } from "react-router-dom";
import { connectionAPI } from "../api";
import { Button } from "@mui/material";

export default function People(){

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("")
    const [requestingId, setRequestingId] = useState("")
    const [sentRequests,setSentRequests ] = useState([])
    
    const navigate = useNavigate();

    useEffect(()=>{
        const fetchUsers = async () =>{
            try{
                console.log("hi")
                const response = await userAPI.get("/");
                setUsers(response.data.users)
            }catch (err) {
                console.error("Failed to fetch users:", err);
                setError("Unable to load people. Please try again.");
            } finally {
                setLoading(false);
            }
        }

        fetchUsers();
        fetchSentRequests();
    },[])

    const fetchSentRequests = async () => {
        try{
            const response = await connectionAPI.get("/sent");

            const sentIds = response.data.requests.map(
                (request) => request.receiver._id
            )

            setSentRequests(sentIds)
            console.log(sentIds)
        }catch (error) {
            console.error("Failed to fetch sent requests:", error);
        }
    }
    
    const handleConnect = async (e, personId)=>{
        e.stopPropagation()

        try{
            setRequestingId(personId);
            setError("")

            await connectionAPI.post("/",{
                receiverId: personId
            })

            setSentRequests((prev) => [...prev, personId]);
        }catch(error){
            console.error("Failed to send Connection req")

            setError(error.response?.data?.message ||
            "Unable to send connection request.")
        }finally{
            setRequestingId("")
        }
    }
    
    return (
    <div className="people-page">
        <Navbar />

        <main className="people-container">
            <h1>Discover People</h1>
            <p className="people-subtitle">
                Find people and grow your professional network.
            </p>

            {error && <p className="people-error">{error}</p>}
            
            {loading ? (
                <p>Loading people...</p>
            ) : error ? (
                <p className="people-error">{error}</p>
            ) : users.length === 0 ? (
                <p>No other users found yet.</p>
            ) : (
                <div className="people-grid">
                    {users.map((person) => (
                        <article
                            className="person-card"
                            key={person._id}
                            onClick={()=> navigate(`/people/${person._id}`)}
                            style={{ cursor: "pointer" }}
                        >
                            <div className="person-avatar">
                                {person.profilePicture ? (
                                    <img
                                        src={person.profilePicture}
                                        alt={person.name || person.username}
                                    />
                                ) : (
                                    <UserRound size={42} />
                                )}
                            </div>

                            <h2>{person.name || person.username}</h2>

                            <p className="person-headline">
                                {person.headline || "Professional member"}
                            </p>

                            {person.location && (
                                <p className="person-location">
                                    <MapPin size={15} />
                                    {person.location}
                                </p>
                            )}

                            <Button
                                variant = "contained"
                                disabled = {
                                    requestingId === person._id || sentRequests.includes(person._id)
                                }
                                onClick={(e) =>
                                    handleConnect(e, person._id)
                                }
                            >
                                {requestingId === person._id
                                    ? "Sending..."
                                    : sentRequests.includes(person._id)
                                    ? "Request Sent"
                                    : "Connect"}
                            </Button>
                        </article>
                    ))}
                </div>
            )}
        </main>
    </div>
);

}