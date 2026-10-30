import { useEffect, useState } from "react";
import { userAPI, connectionAPI } from "../../services/api";
import Navbar from "../navigation/Navbar";
import { UserRound, MapPin } from "lucide-react";
import "./People.css";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";

export default function People(){

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("")
    const [connectionStatuses, setConnectionStatuses] = useState({});
    const [requestingId, setRequestingId] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState("");
    
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
    
    const handleConnect = async (e, personId)=>{
        e.stopPropagation()

        try{
            setRequestingId(personId);
            setError("")

            await connectionAPI.post("/",{
                receiverId: personId
            })

            setConnectionStatuses((prev) => ({
                ...prev,
                [personId]: "pending_sent"
            }));
        }catch(error){
            console.error("Failed to send Connection req")

            setError(error.response?.data?.message ||
            "Unable to send connection request.")
        }finally{
            setRequestingId("")
        }
    }

    //search when user pauses typing
    useEffect(()=>{
        const term = searchTerm.trim()

        if(term.length< 2){
            setSearchResults([])
            setSearchLoading(false)
            setSearchError("")
            return;
        }

        let cancelled = false

        const timer = setTimeout(async ()=>{
            setSearchError("")
            setSearchLoading(true)

            try{
                const response = await userAPI.get("/search", {
                    params: {q: term}
                })

                if(!cancelled){
                    setSearchResults(response.data.users || [])
                }
            }catch(error){
                if(!cancelled){
                    setSearchResults([]);
                    setSearchError(
                        error.response?.data?.message ||
                        "Unable to search users."
                    );
                }
            }finally {
                if (!cancelled) {
                    setSearchLoading(false);
                }
            }
        }, 300)

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };

    }, [searchTerm])
    const displayedUsers = searchTerm.trim().length >= 2
    ? searchResults
    : users;

    useEffect(() => {
        let active = true

        const fetchConnectionStatus = async () =>{
            if(displayedUsers.length === 0) return
            try{
                const results = await Promise.all(
                    displayedUsers.map(async (person)=>{
                        try{
                            const response = await connectionAPI.get(`/status/${person._id}`)

                            return {
                                id: person._id,
                                status: response.data.status
                            }
                        }catch(error){
                            console.log("Failed to check status",error)
                            return {
                                id: person._id,
                                status: "unknown"
                            };
                        }
                    })
                )

                if(!active) return;

                setConnectionStatuses(prev => {
                    const updated = {...prev}

                    results.forEach(({ id, status }) => {
                        updated[id] = status;
                    });

                    return updated;
                })
            }catch (error) {
                console.error("Unable to fetch connection statuses:", error);
            }
        };

        fetchConnectionStatus();

        return()=>{
            active = false
        }
    }, [displayedUsers])
    
    return (
    <div className="people-page">
        <Navbar />

        <main className="people-container">
            <h1>Discover People</h1>

            <p className="people-subtitle">
                Find people and grow your professional network.
            </p>

            {/* Search bar */}
            <div className="people-search">
                <input
                    type="text"
                    placeholder="Search people by username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* General errors */}
            {error && (
                <p className="people-error">{error}</p>
            )}

            {/* Search status */}
            {searchLoading && <p>Searching...</p>}

            {searchError && (
                <p className="people-error">{searchError}</p>
            )}

            {loading ? (
                <p>Loading people...</p>
            ) : (
                <>
                    {searchTerm.trim().length >= 2 && (
                        <h2>Search Results</h2>
                    )}

                    {displayedUsers.length === 0 ? (
                        <p>
                            {searchTerm.trim().length >= 2
                                ? searchLoading
                                    ? "Searching for people..."
                                    : "No matching users found."
                                : "No other users found yet."}
                        </p>
                    ) : (
                        <div className="people-grid">
                            {displayedUsers.map((person) => (
                                <article
                                    className="person-card"
                                    key={person._id}
                                    onClick={() =>
                                        navigate(`/people/${person._id}`)
                                    }
                                    style={{ cursor: "pointer" }}
                                >
                                    <div className="person-avatar">
                                        {person.profilePicture ? (
                                            <img
                                                src={person.profilePicture}
                                                alt={
                                                    person.name ||
                                                    person.username
                                                }
                                            />
                                        ) : (
                                            <UserRound size={42} />
                                        )}
                                    </div>

                                    <h2>
                                        {person.name || person.username}
                                    </h2>

                                    <p className="person-headline">
                                        {person.headline ||
                                            "Professional member"}
                                    </p>

                                    {person.location && (
                                        <p className="person-location">
                                            <MapPin size={15} />
                                            {person.location}
                                        </p>
                                    )}

                                    <Button
                                        variant={
                                            connectionStatuses[person._id] === "none"
                                                ? "contained"
                                                : "outlined"
                                        }
                                        disabled={
                                            requestingId === person._id ||
                                            !connectionStatuses[person._id] ||
                                            connectionStatuses[person._id] === "unknown" ||
                                            connectionStatuses[person._id] !== "none"
                                        }
                                        onClick={(e) => handleConnect(e, person._id)}
                                    >
                                        {requestingId === person._id
                                            ? "Sending..."
                                            : connectionStatuses[person._id] === "none"
                                                ? "Connect"
                                                : connectionStatuses[person._id] === "pending_sent"
                                                    ? "Request Sent"
                                                    : connectionStatuses[person._id] === "pending_received"
                                                        ? "Respond to Request"
                                                        : connectionStatuses[person._id] === "connected"
                                                            ? "Connected"
                                                            : "Checking..."}
                                    </Button>
                                </article>
                            ))}
                        </div>
                    )}
                </>
            )}
        </main>
    </div>
);}