import { useEffect, useState } from "react";
import { userAPI } from "../api";
import Navbar from "./Navbar";
import { UserRound, MapPin } from "lucide-react";
import "./People.css";
import { useNavigate } from "react-router-dom";

export default function People(){

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("")
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
    },[])
    
    
    return (
    <div className="people-page">
        <Navbar />

        <main className="people-container">
            <h1>Discover People</h1>
            <p className="people-subtitle">
                Find people and grow your professional network.
            </p>
            
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
                        </article>
                    ))}
                </div>
            )}
        </main>
    </div>
);

}