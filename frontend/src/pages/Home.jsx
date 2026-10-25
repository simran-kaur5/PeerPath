import Navbar from "../components/Navbar";
import "./Home.css"
import homePerson from "../assets/home-person.png";
import { Mail } from 'lucide-react';

export default function Home(){
    return (
        <div className="Home">
            <Navbar/>
            <div className="homeContent">
                <div className="tags">
                    <div className="tag">Explore.</div>
                    <div className="tag">Connect.</div>
                    <div className="tag">Grow.</div>
                    <button className="login">Continue using Email Id
                        <span className="mailIcon"><Mail/></span>
                    </button>
                </div>

                <div className="image-container">
                    <img src={homePerson} alt="Person working on a laptop" />
                </div>
            </div>
        </div>
        
    )
}