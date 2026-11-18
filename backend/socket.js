import { Server } from "socket.io";
import passport from "passport";
import { handleStopTyping, handleTyping, notifyStoppedTyping } from "./controllers/socketController.js";

export function initializeSocket(httpServer, allowedOrigins, sessionMiddleware){
    const io = new Server(httpServer,{
        cors: {
            origin: allowedOrigins,
            credentials: true,
            methods: ["GET", "POST"]
        }
    })


    io.engine.use(sessionMiddleware) // share express session with socket.io

    // share passport authentication
    io.engine.use(passport.initialize())
    io.engine.use(passport.session())

    io.use((socket, next)=>{
        if(!socket.request.user){
            return next(new Error("Unauthorized"))
        }

        next()
    })

    io.on("connection", (socket)=>{
        const userId = socket.request.user._id.toString()

        socket.data.userId = userId

        socket.join(`user:${userId}`)

        const typingConversations  = new Set()

        console.log("Authenticated user connected:", userId)
        console.log("Socket ID:", socket.id);

        socket.on("typing", async(data)=>{
            const isValid = await handleTyping(socket, io,data);

            if(isValid){
                typingConversations.add(data.conversationId)
            }
        })

        socket.on("stop-typing", async (data) =>{
            await handleStopTyping(socket, io,data)

            if(data?.conversationId){
                typingConversations.delete(data.conversationId)
            }
        })

        socket.on("disconnect",async ()=>{
            for (const conversationId of typingConversations) {
                await notifyStoppedTyping(socket, io, conversationId);
            }
            console.log("Socket disconnected:", userId);
        })
    })

    return io;
}