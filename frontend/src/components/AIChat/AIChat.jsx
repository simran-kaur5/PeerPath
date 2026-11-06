import { useState,useRef, useEffect } from "react";
import axios from "axios";
import "./AIChat.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { userAPI } from "../../services/api";

const AI_API = import.meta.env.VITE_AI_API_URL;

function AIChat(){
    const [message, setMessage] = useState("")
    const [messages, setMessages] = useState([])

    const [conversationId, setConversationId] = useState(null)
    const [loading, setLoading] = useState(false)
    const [publishingDraftId, setPublishingDraftId] = useState(null)
    const [draftImages, setDraftImages] = useState({});
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [messages, loading]);

    const sendMessage = async (e) =>{
        e.preventDefault()

        let token = null

        try{
            const tokenResponse = await userAPI.get("/ai-token", {
                withCredentials: true
            });
            token = tokenResponse.data.token;
            } catch (error) {
                if (error.response?.status !== 401) {
                    throw error;
                }
            }



        if(!message.trim() || loading) return
        
        const userMessage = message.trim()

        setMessages((prev)=>[
            ...prev,
            {role:"user", content: userMessage}
        ])

        setMessage("")
        setLoading(true)

        try{
            const response = await axios.post(`${AI_API}/chat`,{
                message: userMessage,
                conversation_id: conversationId
                },
                {
                    headers: token
                        ? { Authorization: `Bearer ${token}` }
                        : {}
                }
            )

            setConversationId(response.data.conversation_id)

            setMessages((prev)=>[
                ...prev,
                {role:"assistant",
                content: response.data.reply,
                draft_id: response.data.draft_id,
                published: false
                }
            ])
            
        }catch(error){
           console.error("AI Chat Error:", error); 

           setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "Sorry, something went wrong. Please try again."
                }
            ]);
        }finally{
            setLoading(false)
        }
    }

    const publishingDraft = async(draftId, image = null)=>{
        const formData = new FormData()

        formData.append("draft_id", draftId)

        setPublishingDraftId(draftId);

        if (image) {
            formData.append("image", image);
        }

         console.log("Draft ID:", draftId);
        console.log("FormData entries:", [...formData.entries()]);

        try{
            // Get a fresh JWT from Express
            const tokenResponse = await userAPI.get("/ai-token",{
                withCredentials: true
            })

            const token = tokenResponse.data.token

            const response = await axios.post(
                `${AI_API}/publish`,
                formData,
                {
                    headers:{
                        Authorization : `Bearer ${token}`
                    }
                }
            )

            if (response.data.success) {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.draft_id === draftId
                            ? { ...msg, published: true }
                            : msg
                    )
                );
            }
        }catch (error) {
            console.error("Publish Error:", error);

            alert(
                error.response?.data?.detail ||
                "Failed to publish post. Please try again."
            );
        } finally {
            setPublishingDraftId(null);
        }
    }

    return (
        <div className="ai-chat">
            <h2>PeerPath AI</h2>

            <div className="chat-messages">
                {messages.map((msg, index)=>(
                    <div key={index} className={`message ${msg.role}`}>
                        <strong>
                            {msg.role === "user"? "You": "PeerPath AI"}
                        </strong>

                        <div className="message-content">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {msg.content}
                            </ReactMarkdown>
                        </div>

                        {msg.draft_id && !msg.published && (
                            <div className="draft-image-section">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;

                                        if (!file.type.startsWith("image/")) {
                                            alert("Please select an image.");
                                            e.target.value = "";
                                            return;
                                        }

                                        if (file.size > 5 * 1024 * 1024) {
                                            alert("Image must be under 5 MB.");
                                            e.target.value = "";
                                            return;
                                        }

                                        setDraftImages(prev => ({
                                            ...prev,
                                            [msg.draft_id]: file
                                        }));
                                    }}
                                />

                        {draftImages[msg.draft_id] && (
                            <div>
                                <img
                                    src={URL.createObjectURL(draftImages[msg.draft_id])}
                                    alt="Draft attachment"
                                    width="120"
                                />

                                <button
                                    type="button"
                                    onClick={() => {
                                        setDraftImages(prev => {
                                            const updated = { ...prev };
                                            delete updated[msg.draft_id];
                                            return updated;
                                        });
                                    }}
                                >
                                    Remove image
                                </button>
                            </div>
                        )}
                    </div>
                    )}

                    
                    {msg.draft_id && !msg.published && (
                    <button
                        onClick={() => publishingDraft(
                            msg.draft_id,
                            draftImages[msg.draft_id] || null
                        )}
                        disabled={publishingDraftId !== null}
                    >
                        {publishingDraftId === msg.draft_id
                            ? "Publishing..."
                            : "Publish"}
                    </button>
                )}

                {msg.published && (
                    <p>Post published successfully!</p>
                )}
                    </div>
                ))}

                {loading && (
                    <p>PeerPath AI is thinking...</p>
                )}
                
                <div ref={messagesEndRef} />

            </div>

            <form onSubmit={sendMessage}>

                <input type="text" value={message} onChange={(e)=> setMessage(e.target.value)} placeholder="Ask PeerPath AI"/>
                <button type="submit" disabled={loading}>
                    Send
                </button>
            </form>
        </div>
    )
}

export default AIChat;