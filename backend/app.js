import express from "express"
import cors from "cors"
import mongoose from "mongoose";
import post from "./routes/post.js";
import user from "./routes/user.js"
import session from "express-session";
import passport from "passport";
import dotenv from "dotenv";
import User from "./models/User.js";
import LocalStrategy from "passport-local"
import MongoStore from "connect-mongo";
import connection from "./routes/connection.js"
import notifications from "./routes/notifications.js"

const app = express()
app.set("trust proxy", 1);

dotenv.config();

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto:{
        secret:process.env.SECRET
    },
    touchAfter:24*3600
})

store.on("error",()=>{
    console.log("Error in store")
})

const sessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store,
    cookie: {
        expires : Date.now() + 7*24*60*60*1000,
        maxAge : 7*24*60*60*1000,
        httpOnly:true
    }
}

const allowedOrigins = [
    "http://localhost:5173",
    "https://peerpath-1.onrender.com"
];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(session(sessionOptions))

app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Routes
app.use("/posts", post);
app.use("/users", user);
app.use("/connections",connection)
app.use("/notifications", notifications);

const PORT = process.env.PORT || 5000;

async function main(){

    try{
        let response = await mongoose.connect(process.env.MONGODB_URL)
        if(response){
            console.log("Database connected")
        }
    }catch(error){
        console.log(error)
    }
}

main()


app.get("/",(req,res)=>{
    res.send("Hi root")
})

app.use((err, req, res, next) => {
    console.error("Backend error:", err);

    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Something went wrong. Please try again later." 
    });
});


app.listen(PORT,()=>{
    console.log("Server listing")
})