import express from "express"
import { isLoggedIn, validateBody } from "../middleware.js";
import multer from "multer";
import { storage } from "../cloudConfig.js";
import { getMe, updateMe, updateProfilePicture, getUsers, registerUser, loginUser, logoutUser, updateProfile, getPublicUser } from "../controllers/userController.js";

const upload = multer({ storage });
const router = express.Router()


router.get("/me", isLoggedIn, getMe);


router.put("/me",isLoggedIn,validateBody,updateMe)

router.put("/me/profile-picture", isLoggedIn, upload.single("profilePicture"), updateProfilePicture)

router.get("/", isLoggedIn, getUsers)

router.post("/register",validateBody,registerUser)

router.post("/login",validateBody,loginUser);

router.post("/logout",logoutUser)

router.put("/profile",isLoggedIn,validateBody, updateProfile)

router.get("/:id", isLoggedIn, getPublicUser)

export default router;