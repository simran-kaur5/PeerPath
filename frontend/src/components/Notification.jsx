import { useEffect, useState } from "react";
import { notificationAPI } from "../api";
import Navbar from "../components/Navbar";
import { Bell, CheckCheck } from "lucide-react";
import "./Notification.css";

export default function Notification(){
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    const fetchNotification = async()=>{
        try{
            const response = await notificationAPI.get("/")
            setNotifications(response.data.notifications)
        }catch(error){
            setError(error.response?.data?.message || "failed to load notifications")
        }finally{
            setLoading(false)
        }
    }

    useEffect(()=>{
        fetchNotification()
    },[])

    const markAsRead = async(notificationId)=>{
        try{
            await notificationAPI.patch(`/${notificationId}/read`)

            setNotifications((prev) =>
                prev.filter(
                    (notification) => notification._id !== notificationId
                )
            );
        }catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to mark notification as read"
            );
        }
    }

    const markAllAsRead = async () =>{
        try{
            await notificationAPI.patch("/read-all")

            setNotifications([]);
        }catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to mark notifications as read"
            );
        }
    }

    return (
        <div className="notifications-page">

            <Navbar/>

            <main>
                <div className="notifications-header">
                    <div>
                        <h1>Notifications</h1>
                        <p>Stay updated with your network.</p>
                    </div>
                    <button
                        className="mark-all-button"
                        onClick={markAllAsRead}
                        disabled={
                            !notifications.some((item) => !item.isRead)
                        }
                    >
                        <CheckCheck size={17} />
                        Mark all as read
                    </button>
                </div>

                {error && (
                    <p className="notification-error">{error}</p>
                )}

                {loading ? (
                    <p className="notification-status">
                        Loading notifications...
                    </p>
                ) : notifications.length === 0 ? (
                    <div className="empty-notifications">
                        <Bell size={38} />
                        <h3>No notifications yet</h3>
                        <p>
                            When someone connects with you or interacts
                            with your posts, you'll see it here.
                        </p>
                    </div>

                    ) : (
                    <div className="notification-list">
                        {notifications.map((notification) => (
                            <div
                                key={notification._id}
                                className={`notification-item ${
                                    notification.isRead ? "read" : "unread"
                                }`}
                            >
                                <img
                                    className="notification-avatar"
                                    src={
                                        notification.sender?.profilePicture ||
                                        "/default-avatar.png"
                                    }
                                    alt=""
                                />

                                <div className="notification-content">
                                    <p>{notification.message}</p>

                                    <span className="notification-date">
                                        {new Date(
                                            notification.createdAt
                                        ).toLocaleString()}
                                    </span>
                                </div>

                                {!notification.isRead && (
                                    <button
                                        className="mark-read-button"
                                        onClick={() =>
                                            markAsRead(notification._id)
                                        }
                                    >
                                        Mark read
                                    </button>
                                )}
                                </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}