import "./styles/App.css";
import { Routes, Route, useParams,Navigate  } from "react-router-dom";

// Pages
import Home from "./pages/home/Home.jsx";
import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";
import EditPost from "./pages/posts/EditPost";
import Delete from "./pages/posts/Delete.jsx";
import Profile from "./pages/profile/Profile";
import EditProfile from "./pages/profile/EditProfile";
import PublicView from "./pages/profile/PublicView";

// Components
import Feed from "./components/posts/Feed";
import PostDetails from "./components/posts/PostDetails";
import NotFound from "./components/shared/NotFound";
import People from "./components/people/People";
import ConnectionRequests from "./components/connections/ConnectionRequests";
import MyConnections from "./components/connections/MyConnections";
import Notification from "./components/notifications/Notification";

function EditPostPage() {
    const { id } = useParams();
    return <EditPost id={id} />;
}

function DeletePost() {
    const { id } = useParams();
    return <Delete id={id} />;
}

function PostDetailsPage() {
    const { id } = useParams();
    return <PostDetails id={id} />;
}

function App() {
    return (
        <Routes>
            <Route path="/" element={sessionStorage.getItem("isLogin") === "true"
            ? <Navigate to="/feed" replace />
            : <Home />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />

            <Route path="/posts/:id/edit" element={<EditPostPage />} />
            <Route path="/posts/:id/delete" element={<DeletePost />} />
            <Route path="/posts/:id" element={<PostDetailsPage />} />

            {/* Own profile */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/edit" element={<EditProfile />} />

            {/* Other people's profiles */}
            <Route path="/people" element={<People />} />
            <Route path="/people/:id" element={<PublicView />} />
            <Route path="/connections" element={<MyConnections />} />

            <Route path="/connections/requests" element={<ConnectionRequests />}/>
            <Route path="/notifications" element={<Notification/>} />

            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

export default App;