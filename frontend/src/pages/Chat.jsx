import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import socket from "../socket/socket.js";
import { messageAPI, userAPI, conversationAPI} from "../services/api.js";
import "./Chat.css"
function Chat() {

    const { conversationId } = useParams();

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef(null);
    const [chatUsername, setChatUsername] = useState("");
    const [chatProfilePicture, setChatProfilePicture] = useState("");

    useEffect(() =>{
        socket.connect();
        return () =>{
            socket.disconnect()
        }
    },[])

    useEffect(()=>{
        const fetchMessages = async () =>{
            try{
                const response = await messageAPI.get(`/${conversationId}`)
                setMessages(response.data.data)
                await messageAPI.patch(`/${conversationId}/read`);
            }catch(error){
                console.error("Error fetching messages:", error);
            }finally {
                setLoading(false);
            }
        }

        fetchMessages()
    }, [conversationId])

    useEffect(() => {
        const handleNewMessage = async (message) => {
            console.log("Incoming message socket", message)
            if(String(message.conversation) === String(conversationId)){
                setMessages((prevMessages) => [
                    ...prevMessages,
                    message
                ])

                try{
                    await messageAPI.patch(`/${conversationId}/read`)
                }catch(error){
                    console.log("Error marking messages as read:", error)
                }
            }
        }
        socket.on("new-message", handleNewMessage)

        return () => {
            socket.off("new-message", handleNewMessage)
        }
    }, [conversationId])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, []);

    useEffect(() => {
        const fetchCurrentUser = async () =>{
            try{
                const res = await userAPI.get("/me")

                setCurrentUserId(res.data.user.id)
            }catch(error){
                console.error("Error fetching current user:", error)
            }
        }
        fetchCurrentUser()
    },[])

    useEffect(()=>{
        const handleMessagesRead = ({conversationId: readConversationId, readAt })=>{
            if (String(readConversationId) !== String(conversationId)) {
                return;
            }

            setMessages((prevMessages) =>
            prevMessages.map((message) => {
                if (String(message.sender._id) === String(currentUserId)) {
                    return {
                        ...message,
                        readAt
                    };
                }

                return message;
            }))
        
        }
        socket.on("message-read", handleMessagesRead);

        return () => {
            socket.off("message-read", handleMessagesRead)
        }
    }, [conversationId, currentUserId])

    useEffect(()=>{
        const handleUserTyping = ({conversationId: typingConversationId })=>{
            if(String(typingConversationId) === String(conversationId)){
                setIsTyping(true)
            }
        }

        const handleUserStoppedTyping = ({ conversationId: typingConversationId }) => {
            if (String(typingConversationId) === String(conversationId)) {
                setIsTyping(false);
            }
        };

        socket.on("user-typing", handleUserTyping);
        socket.on("user-stopped-typing", handleUserStoppedTyping);
        
        return () => {
            socket.off("user-typing", handleUserTyping);
            socket.off("user-stopped-typing", handleUserStoppedTyping);
        };
    },[conversationId])

    useEffect(() => {
        return () => {
            clearTimeout(typingTimeoutRef.current);
            socket.emit("stop-typing", { conversationId });
        };
    }, [conversationId]);

    useEffect(()=>{
        const fetchChatUsername = async () => {
            try{
                const [conversationRes, userRes] = await Promise.all([
                    conversationAPI.get("/"),
                    userAPI.get("/me")
                ])

                const currentUserId = userRes.data.user._id

                const conversation = conversationRes.data.data.find(
                    conv => String(conv._id) === String(conversationId)
                )

                if(conversation){
                    const otherUser = conversation.participants.find(
                        user => String(user._id) !== String(currentUserId)
                    )

                    if(otherUser){
                        setChatUsername(otherUser.username)
                        setChatProfilePicture(otherUser.profilePicture || "");
                    }
                }
            }catch(error){
                console.error("Error fetching chat username:", error)
            }
        }

        fetchChatUsername();
    }, [conversationId])

    useEffect(() => {
        const handleMessageDeleted = ({messageId, conversationId: deletedConversationId })=>{
            if(String(deletedConversationId) !== String(conversationId)){
                return;
            }

            setMessages(prevMessages =>
                prevMessages.filter(message => String(message._id) !== String(messageId))
            );
        }

        socket.on("message-deleted", handleMessageDeleted)
        
        return () => {
            socket.off("message-deleted", handleMessageDeleted)
        }
    }, [conversationId])

    const handleSendMessage = async(e)=>{
        e.preventDefault()

        if(!newMessage.trim()) return;

        try{
            setSending(true)

            const res = await messageAPI.post("/",{
                conversationId,
                content: newMessage
            })

            setMessages((prevMessages)=>[
                ...prevMessages,
                res.data.data
            ])

            setNewMessage("")
        }catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setSending(false);
        }
    }
    
    const handleTyping = (e)=>{
        const value = e.target.value;

        setNewMessage(value)

        if(value.trim()){
            socket.emit("typing",{conversationId})

            clearTimeout(typingTimeoutRef.current)

            typingTimeoutRef.current = setTimeout(() => {
                socket.emit("stop-typing" ,{conversationId})
            }, 1000)
        }else{
            clearTimeout(typingTimeoutRef.current)
            socket.emit("stop-typing", {conversationId})
        }
    }

    const handleDeleteMessage = async (messageId) => {
        try {
            await messageAPI.delete(`/${messageId}`);

            setMessages(prevMessages =>
                prevMessages.filter(message => String(message._id) !== String(messageId))
            );
        } catch (error) {
            console.error("Error deleting message:", error);
        }
    };

return (
    <div className="chat-page">
        <div className="chat-header">
            <img
                className="chat-header-avatar"
                src={chatProfilePicture || "/default-avatar.png"}
                alt={chatUsername}
            />

            <h2 className="chat-header-name">
                {chatUsername || "Chat"}
            </h2>
        </div>

        {loading ? (
            <p>Loading messages...</p>
        ) : (
            <div className="chat-messages">
                {messages.map((message) => (
                    <div key={message._id}>
                        <div
                            className={`message-row ${
                               String(message.sender._id) === String(currentUserId) ? "own" : "received"
                            }`}
                        >
                            <div className="message-bubble">
                                <strong className="message-sender">
                                    {String(message.sender._id) === String(currentUserId)
                                        ? "You"
                                        : message.sender.username}
                                </strong>

                                <p className="message-content">
                                    {message.content}
                                </p>

                                <span className="message-time">
                                    {new Date(message.createdAt).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit"
                                    })}
                                </span>

                                {String(message.sender._id) === String(currentUserId) && (
                                    <span className={`read-status ${message.readAt ? "read" : ""}`}>
                                        {message.readAt ? "✓✓ Read" : "✓ Sent"}
                                    </span>
                                )}

                                {String(message.sender._id) === String(currentUserId) && (
                                    <button
                                        className="delete-message-btn"
                                        onClick={() => handleDeleteMessage(message._id)}
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef}></div>
            </div>
        )}
        
        {isTyping && (
            <span className="typing-indicator">
                typing...
            </span>
        )}
        <form className="chat-form" onSubmit={handleSendMessage}>
            <input
                className="chat-input"
                type="text"
                value={newMessage}
                onChange={handleTyping}
                placeholder="Type a message..."
            />

            <button type="submit" disabled={sending || !newMessage.trim()} className="chat-send-button">
                {sending ? "Sending..." : "Send"}
            </button>
        </form>
    </div>
);
}

export default Chat;