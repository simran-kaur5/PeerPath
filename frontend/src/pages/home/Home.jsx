
import { useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import Navbar from "../../components/navigation/Navbar";
import homePerson from "../../assets/home-person.png";
import "./Home.css";

export default function Home() {
    const navigate = useNavigate();

    const handleLogin = () => {
        navigate("/login");
    };

    const handleSignUp = () => {
        navigate("/signup");
    };

    return (
        <div className="Home">
            <Navbar />

            <main className="homeContent">
                <section className="tags">
                    <h1 className="tag">Explore.</h1>
                    <h1 className="tag">Connect.</h1>
                    <h1 className="tag">Grow.</h1>

                    <button
                        type="button"
                        className="login"
                        onClick={handleLogin}
                    >
                        <span>Continue using Username</span>
                        <Mail className="mailIcon" size={20} />
                    </button>
                    <p className="signup-prompt">
                        First time here?{" "}
                        <button
                            type="button"
                            className="signup-link"
                            onClick={handleSignUp}
                        >
                            Sign Up
                        </button>
                    </p>

                    <p className="feed-prompt">
                        Just looking around?{" "}
                        <button
                            type="button"
                            className="feed-link"
                            onClick={() => navigate("/feed")}
                        >
                            Explore the feed
                        </button>
                    </p>
                </section>

                <div className="image-container">
                    <img
                        src={homePerson}
                        alt="Person working on a laptop"
                    />
                </div>
            </main>
        </div>
    );
}
