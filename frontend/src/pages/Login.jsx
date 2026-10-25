import "./Login.css";
import { Mail, Lock, UserRound } from "lucide-react";
import Navbar from "../components/Navbar";
import image from "../assets/login.png";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import {userAPI} from "../api";

export default function Login() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleSubmit = async(e)=>{
    e.preventDefault()
    setError("")
    setLoading(true)

    try{
      const response = await userAPI.post(
        "/login",
        {username, password},
        {withCredentials:true}
      )
      sessionStorage.setItem("isLogin", "true");
      navigate("/")
    }catch(error){
      setError(error.response?.data?.message || "Login failed. Please try again.")
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
        <img src={image} alt=""  className="loginImage"/>
      <div className="login-card">
        <h1>Welcome back!</h1>
        <p className="login-subtitle">
          Log in to continue your PeerPath journey.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="username">Username</label>
          <div className="input-box">

            <UserRound size={18} />
            <input type="username" placeholder="Enter your username"  value={username}
            onChange={(e)=> setUsername(e.target.value)} required/>
          </div>

          <label htmlFor="password">Password</label>
          <div className="input-box">
            <Lock size={18} />
            <input type="password" placeholder="Enter your password" value={password} onChange={(e)=> setPassword(e.target.value)} required />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading?"Logging in...":"Log in"}
          </button>
        </form>

        <p className="signup-text">
          Don't have an account? <a href="/signup">Sign up</a>
        </p>
      </div>
    </div>
  );
}