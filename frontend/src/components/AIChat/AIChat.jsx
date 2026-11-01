import { useState,useRef, useEffect } from "react";
import axios from "axios";
import "./AIChat.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const AI_API = "https://peerpath-ai.onrender.com";

function AIChat(){
    const [message, setMessage] = useState("")
    const [messages, setMessages] = useState([])

    const [conversationId, setConversationId] = useState(null)
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [messages, loading]);

    const sendMessage = async (e) =>{
        e.preventDefault()

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
            })

            setConversationId(response.data.conversation_id)

            setMessages((prev)=>[
                ...prev,
                {role:"assistant", content: response.data.reply}
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

    return (
        <div>
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