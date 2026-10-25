import "./App.css";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Feed from "./components/Feed";
import NotFound from "./components/NotFound";
import { Routes, Route, useParams } from "react-router-dom";
import EditPost from "./pages/EditPost";
import PostDetails from "./components/PostDetails";
import Delete from "./pages/Delete";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import People from "./components/People";
import PublicView from "./pages/PublicView";
import ConnectionRequests from "./components/ConnectionRequests";

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
            <Route path="/" element={<Feed />} />
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

            <Route path="/connections/requests" element={<ConnectionRequests />}/>
            

            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

export default App;