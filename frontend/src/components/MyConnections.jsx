import { useEffect, useState } from "react";
import { connectionAPI } from "../api";
import Navbar from "./Navbar";
import { UserRound, MapPin } from "lucide-react";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import "./MyConnections.css";


export default function MyConnections(){
    const [connections, setConnections] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    
    const navigate = useNavigate()

    useEffect(()=>{
        const fetchConnections = async ()=>{
            try{
                const response = await connectionAPI.get("/")
                setConnections(Array.isArray(response.data.connections)? response.data.connections: [])
            }catch(error){
                console.log("error", error.response?.data?.message || "Unable to load your connections")
                setError("Unable to load your connections")
            }finally{
                setLoading(false)
            }
        }

        fetchConnections()
    },[])

    return (
        <div className="my-connections-page">
            <Navbar />
            

            <main className="my-connections-container">
                <h1>My Connections</h1>
                <p className="my-connections-subtitle">
                    Your professional network on PeerPath.
                </p>  

                {error && <p className="connections-error">{error}</p>}

                {loading ? (
                    <p>Loading connections...</p>
                ) : error ? null : connections.length === 0 ? (
                <div className="connections-empty">
                    <UserRound size={42} />
                    <h2>No connections yet</h2>
                    <p>Accept connection requests to grow your network.</p>
                    <Button
                    variant="contained"
                    onClick={() => navigate("/people")}
                    >
                    Discover People
                    </Button>

                </div>
            ) : (
            <div className="connections-grid">
                {connections.map((person) => (
                <article className="connection-card" key={person._id}>
                    <div className="connection-avatar">
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
                        <p className="connection-headline">
                        {person.headline || "Professional member"}
                        </p>

                        {person.location && (
                        <p className="connection-location">
                            <MapPin size={15} />
                            {person.location}
                        </p>
                        )}

                        <Button
                            variant="outlined"
                            onClick={() => navigate(`/people/${person._id}`)}
                        >
                        View Profile
                    </Button>
                </article>
            ))}
      </div>
    )}
  </main>
</div>

);
}