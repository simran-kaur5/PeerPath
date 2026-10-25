import { useState } from "react";
import { Avatar, Button } from "@mui/material";
import { UserPlus, Users } from "lucide-react";
import "./SuggestedConnections.css";

const people = [
    {
        id: 1,
        name: "Aarav Sharma",
        role: "Software Engineer at Google",
        mutual: 12,
        initials: "AS",
        color: "#DCEBFA"
    },
    {
        id: 2,
        name: "Priya Mehta",
        role: "Frontend Developer",
        mutual: 8,
        initials: "PM",
        color: "#F8E5D6"
    },
    {
        id: 3,
        name: "Rahul Verma",
        role: "AI/ML Engineering Student",
        mutual: 15,
        initials: "RV",
        color: "#E4E0FA"
    },
    {
        id: 4,
        name: "Neha Gupta",
        role: "Software Developer",
        mutual: 6,
        initials: "NG",
        color: "#DDF3E4"
    }
];

export default function SuggestedConnections() {
    const [connected, setConnected] = useState([]);

    const handleConnect = (id) => {
        setConnected((prev) =>
            prev.includes(id)
                ? prev.filter((item) => item !== id)
                : [...prev, id]
        );
    };

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

            <div className="suggested-list">
                {people.map((person) => (
                    <div className="suggested-person" key={person.id}>
                        <Avatar
                            className="suggested-avatar"
                            sx={{
                                bgcolor: person.color,
                                color: "#263746"
                            }}
                        >
                            {person.initials}
                        </Avatar>

                        <div className="suggested-person-info">
                            <h3>{person.name}</h3>
                            <p className="suggested-role">
                                {person.role}
                            </p>
                            <p className="mutual-connections">
                                <Users size={13} />
                                {person.mutual} mutual connections
                            </p>

                            <Button
                                variant="outlined"
                                size="small"
                                className={`connect-button ${
                                    connected.includes(person.id)
                                        ? "connected"
                                        : ""
                                }`}
                                startIcon={
                                    <UserPlus size={15} />
                                }
                                onClick={() =>
                                    handleConnect(person.id)
                                }
                            >
                                {connected.includes(person.id)
                                    ? "Pending"
                                    : "Connect"}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <button className="see-all-connections">
                Show all suggestions
                <span>→</span>
            </button>
        </div>
    );
}
