import { Users, UserRound } from 'lucide-react';
import { useState, useEffect } from 'react';
import "./Navbar.css"
import { Link, useNavigate } from "react-router-dom";
import { userAPI } from '../api';

export default function Navbar(){

    let [isLogin,setisLogin] = useState(!!sessionStorage.getItem("isLogin"));
    const [profilePicture, setProfilePicture] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        if (!isLogin) return;

        const fetchProfile = async () => {
            try {
                const response = await userAPI.get("/me");
                setProfilePicture(
                    response.data.user.profilePicture || ""
                );
            } catch (error) {
                console.log("Unable to load profile picture", error);
            }
        };

        fetchProfile();
    }, [isLogin]);

    const handleLogout = async ()=>{
        try{
            await userAPI.post("/logout")
            sessionStorage.removeItem("isLogin")
            setisLogin(false)
            navigate("/login")
        }catch(error){
            console.log("Logout failed",error)
        }
    }

    return (
        <div className='Navbar'>
            <div className='name'>
                <div className='title'>PeerPath</div>
                
                <div className="icon">
                    <Users />
                </div>
            </div>

            <div className='options'>
                <Link to="/" className="nav-link">Explore</Link>
                <Link to="/people" className="nav-link">People</Link>

                {isLogin && (
                    <>
                        <div onClick={() => navigate("/connections/requests")}>
                            Notifications
                        </div>

                        <div onClick={() => navigate("/connections")}>
                            My Connections
                        </div>
                    </>
                )}

                {
                    isLogin?(
                        <>
                            <button onClick={handleLogout}>Logout</button>
                            <div className="navbar-profile" onClick={() => navigate("/profile")} title="View Profile">
                                {profilePicture ? (
                                    <img
                                        src={profilePicture}
                                        alt="Profile"
                                    />
                                ) : (
                                    <UserRound size={24} />
                                )}
                            </div>
                        </>):
                    
                    (<Link to="/login" className='loginButton'>Sign In</Link>)
                    
                }
            </div>
            

        </div>
    )
}