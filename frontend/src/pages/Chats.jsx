import { useEffect, useState } from "react";
import { conversationAPI, userAPI } from "../services/api";
import { useNavigate } from "react-router-dom";
import "./Chats.css"
import socket from "../socket/socket.js";

function Chats(){
    const [conversations, setConversations] = useState([])
    const [currentUserId, seturrentUserId] = useState(null)
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate();

    useEffect(() =>{
        const fetchChats = async () =>{
            try{
                const [conversationRes, userRes] = await Promise.all([
                    conversationAPI.get("/"),
                    userAPI.get("/me")
                ])

                setConversations(conversationRes.data.data)
                seturrentUserId(userRes.data.user._id)
            }catch(error){
                console.error("Failed to fetch chats:", error)
            }finally{
                setLoading(false)
            }
        }
        fetchChats()
    },[])

    useEffect(()=>{
        socket.connect()
        const handleNewMessage = (message) => {
            setConversations(prevConversations =>
                prevConversations.map(conversation => {
                    if(String(conversation._id) === String(message.conversation)){
                        return {
                            ...conversation,
                            lastMessage: message,
                            lastMessageAt: message.createdAt,
                            unreadCount: (conversation.unreadCount || 0) + 1
                        };
                    }

                    return conversation;
                })
            )
        }

        socket.on("new-message", handleNewMessage)

        return () =>{
            socket.off("new-message", handleNewMessage)
        }
    })

    useEffect(() => {
        const handleMessageDeleted = ({ conversationId, lastMessage, wasUnread }) => {
            setConversations(prev =>
                prev.map(conversation =>
                    String(conversation._id) === String(conversationId)
                        ? {
                            ...conversation,
                            lastMessage,
                            lastMessageAt: lastMessage?.createdAt || null,
                            unreadCount: wasUnread
                                ? Math.max(0, (conversation.unreadCount || 0) - 1)
                                : conversation.unreadCount
                        }
                        : conversation
                )
            );
        };

        socket.on("message-deleted", handleMessageDeleted);

        return () => {
            socket.off("message-deleted", handleMessageDeleted);
        };
    }, []);

    if(loading){
        return <p>Loading chats...</p>;
    }

    if (conversations.length === 0) {
        return <h3>No conversations yet.</h3>;
    }

    return (
        <div className="chats-page">
            <h2>Chats</h2>

            {conversations.map((conversation)=>{
                const otherUser = conversation.participants.find(
                    user => user._id !== currentUserId
                )

                if(!otherUser){
                    return null;
                }

                return (
                    <div key={conversation._id} className="chat-item" onClick={() => navigate(`/chat/${conversation._id}`)}>
                        <img
                            src={otherUser.profilePicture || "/default-avatar.png"}
                            alt={otherUser.username}
                        />

                        <div>
                            <h4>{otherUser.username}</h4>
                            <p>
                                {conversation.lastMessage?.content || "Start a conversation"}
                            </p>
                        </div>
                        {conversation.unreadCount > 0 && (
                            <span className="unread-badge">
                                {conversation.unreadCount}
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    )
}

export default Chats;