import express from "express"
import User from "../models/User.js";
import { StatusCodes } from "http-status-codes";
import passport from "passport";
const router = express.Router()
import { isLoggedIn, validateBody } from "../middleware.js";
import multer from "multer";
import { storage } from "../cloudConfig.js";
import Connection from "../models/Connection.js";

const upload = multer({ storage });


router.get("/me", isLoggedIn, (req, res) => {
    const user = req.user
    res.json({
        user: {
            id: user._id,
            username: user.username,
            name: user.name || "",
            headline: user.headline || "",
            location: user.location || "",
            bio: user.bio || "",
            skills: user.skills || [],
            education: user.education || "",
            website: user.website || "",
            profilePicture: user.profilePicture || ""
        }
    });
});


router.put("/me",isLoggedIn,validateBody, async(req,res)=>{
    try{
        const {name, headline, location, bio, skills, education, website} = req.body || {}

        const updateUser = await User.findByIdAndUpdate(
            req.user?.id,
            {name, headline, location, bio, skills, education, website},
            {new:true, runValidators:true}
        )

        res.json({
            message: "profile Updated sucessfully",
            user: updateUser
        })
    }catch(error){
        res.status(500).json({
            message: "failed to update profile"
        })
    }
})

router.put("/me/profile-picture", isLoggedIn, upload.single("profilePicture"), async (req,res)=>{
    try{
        if(!req.file){
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: "Please select a profile picture"
            })
        }

        req.user.profilePicture = req.file.path
        await req.user.save()

        res.status(StatusCodes.OK).json({
            message: "Profile picture updated successfully",
            profilePicture: req.user.profilePicture
        })
    }catch(error){
        console.error("Profile picture upload failed:", error);

        res.status(500).json({
            message: "Unable to update profile picture"
        });
    }
})

router.get("/", isLoggedIn, async(req,res)=>{
    try{
        const connections = await Connection.find({
            status: 'accepted',
            $or: [
                {sender: req.user._id},
                {receiver: req.user._id}
            ]
        })

        const connectedIds = connections.map((connection) =>
            String(
                String(connection.sender) === String(req.user._id)
                ? connection.receiver
                : connection.sender
            )
            );

        const users = await User.find({
            _id: { $nin: [req.user._id, ...connectedIds]}
    })

        return res.status(StatusCodes.OK).json({users})
    }catch(error){
        console.log("Fetch users failed", error)

        return res.status(StatusCodes.BAD_REQUEST).json({
            message: "Unable to fetch users"
        })
    }
})

router.post("/register",validateBody,async (req,res,next)=>{
    try{
        const {username, password,name, headline, location} = req.body || {}
        if(!username || !password){
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: "username and passport are required"
            })
        }

        const newUser = new User({username,
            name: name || "",
            headline: headline || "",
            location: location || ""
        })

        const registeredUser = await User.register(
            newUser,password
        )

        req.login(registeredUser,(err)=>{
            if(err){
                return next(err)
            }

            return res.status(StatusCodes.CREATED).json({
                message:"Registered sucessfully",
                user:{
                    id: registeredUser._id,
                    username: registeredUser.username
                }
            })
        })
    }catch(error){
        if( error.name === "UserExistsError" ||
            error.name === "MongoServerError" ||
            error.code === 11000){
            return res.status(StatusCodes.CONFLICT).json({
                message:"Username already exists"
            })
        }
        next(error)
    }
    
})

router.post("/login",validateBody, (req, res, next) => {
    const { username, password } = req.body || {};

    if (!username || !password) {
        return res.status(400).json({
            message: "Username and password are required"
        });
    }
    passport.authenticate("local", (err, user, info) => {
        if (err) return next(err);

        if (!user) {
            return res.status(401).json({
                message: "User not found or invalid password"
            });
        }

        req.login(user, (err) => {
            if (err) return next(err);

            res.json({
                message: "Login successful",
                user: {
                    id: user._id,
                    username: user.username
                }
            });
        });
    })(req, res, next);
});

router.post("/logout",(req,res,next)=>{
    req.logout((err)=>{
        if(err){
            return next(err)
        }

        req.session.destroy((err)=>{
            if(err){
                return next(err)
            }

            res.clearCookie("connect.sid")
            res.json({message:"Logout succesfully"})
        })
    })
})

router.put("/profile",isLoggedIn,validateBody, async(req,res)=>{
    try{
        const {name,bio,headline,profilePicture, location,
               skills, education,website} = req.body

        const updateUser = await User.findByIdAndUpdate(
            req.user._id,
            {
                name,bio,headline,profilePicture, location,
                skills, education,website
            },
            { new: true, runValidators: true }
        ).select("-hash -salt")

        res.status(StatusCodes.OK).json({
            message:"Profile updated sucessfully",
            user:updateUser
        })
    }catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "Failed to update profile"
        });
    }
})

router.get("/:id", isLoggedIn, async(req,res)=>{
    try{
        let {id} = req.params

        if(!id || !id.trim()){
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: "User ID is required"
            })
        }

        const user = await User.findById(id).select("username name headline location profilePicture")

        if(!user){
            return res.status(StatusCodes.NOT_FOUND).jsin({
                message : "User not Found"
            })
        }
        console.log(user)
        return res.status(StatusCodes.OK).json({user})
    }catch(error){
        console.log("Fetch public profile failed", error)

        if (error.name === "CastError") {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: "Invalid user ID"
            });
        }

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "Unable to load profile"
        })
    }
})

export default router;