import { Users, UserRound, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import "./Navbar.css"
import { Link, useNavigate } from "react-router-dom";
import { userAPI, notificationAPI } from "../../services/api";

export default function Navbar(){

    let [isLogin,setisLogin] = useState(false);
    const [profilePicture, setProfilePicture] = useState("");
    const [unreadCount, setUnreadCount] = useState(0);

    const navigate = useNavigate();

    useEffect(() => {

        const checkLogin = async () => {
            try {
                const response = await userAPI.get("/me");

                setisLogin(true);
                sessionStorage.setItem("isLogin", "true");

                setProfilePicture(
                    response.data.user.profilePicture || ""
                );
            } catch (error) {
                setisLogin(false);
                sessionStorage.removeItem("isLogin");
                setProfilePicture("");
                setUnreadCount(0);
            }
        };

        checkLogin();
    }, [isLogin]);

    useEffect(() => {
        if (!isLogin) {
            setUnreadCount(0)
            return;
        }

        const fetchUnreadCount = async () => {
            try {
                const response = await notificationAPI.get("/unread-count");
                setUnreadCount(response.data.count)
            } catch (error) {
                console.error("Unable fetch unread notifications", error);
            }
        };

        fetchUnreadCount();
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
                <Link to="/feed" className="nav-link">Explore</Link>
                <Link to="/people" className="nav-link">People</Link>

                {isLogin && (
                    <>
                        <div onClick={() => navigate("/connections/requests")}>
                            Requests
                        </div>

                        <button className='notification-bell' onClick={()=> navigate("/notifications")}
                            title='Notifications'
                            >

                                <Bell size = {22}/>
                                {unreadCount>0 && (
                                    <span className='notification-badge'>
                                        {unreadCount > 99 ? "99+": unreadCount}
                                    </span>
                                )}
                            </button>

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