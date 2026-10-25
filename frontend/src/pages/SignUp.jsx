import "./SignUp.css";
import { UserRound, Mail, Lock, BriefcaseBusiness, MapPin } from "lucide-react";
import {Button} from "@mui/material";
import Navbar from "../components/Navbar";
import { Link, useNavigate } from "react-router-dom";
import { userAPI } from "../api";
import { useState } from "react";

export default function SignUp() {
  const [formData, setFormData] = useState({
        username: "",
        password: "",
        name: "",
        headline: "",
        location: ""});
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleChange = (e) => {
      setFormData({
      ...formData,
      [e.target.name]: e.target.value
      });
      }

  const handleSubmit = async(e)=>{
    e.preventDefault()
    setError("")
    setLoading(true)

    try{
      await userAPI.post("/register",formData)
      sessionStorage.setItem("isLogin","true")
      navigate("/")
    }catch(error){
      setError(error.response?.data?.message || "Registration failed..")
    }finally{
      setLoading(false)
    }
  }
  return (
    <div className="signup-page">
      <Navbar />

      <div className="signup-content">
        <div className="signup-card">

          <h1>Create your account</h1>
          <p className="signup-subtitle">
            Build your network. Discover opportunities. Grow together.
          </p>

          <form className="signup-form" onSubmit={handleSubmit}>

            <label htmlFor="username">Full Name</label>
              <div className="input-box">
                  <UserRound size={18} />
                <input
                    id="name"
                    type="name"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    autoComplete="name"
              />
              </div>

            <label htmlFor="username">Username</label>
              <div className="input-box">
                  <UserRound size={18} />
                <input
                    id="username"
                    type="text"
                    name="username"
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={handleChange}
                    autoComplete="username"
                    required
              />
              </div>

            <label htmlFor="password">Password</label>
              <div className="input-box">
                <Lock size={18} />
                <input
                    id="password"
                    type="password"
                    name="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                />
            </div>

            <label htmlFor="healine">Professional Headline (optional)</label>
              <div className="input-box">
                <BriefcaseBusiness size={18} />
                <input
                    id="headline"
                    type="text"
                    name="headline"
                    placeholder="e.g. Student | Web Developer"
                    value={formData.headline}
                    onChange={handleChange}
                />
            </div>

            <label htmlFor="location">Location (optional)</label>
              <div className="input-box">
                <MapPin size={18} />
                <input
                    id="location"
                    name="location"
                    type="text"
                    placeholder="e.g. Ludhiana, India"
                    value={formData.location}
                    onChange={handleChange}
                    autoComplete="address-level2"
                />
            </div>

            {error && <p className="signup-error">{error}</p>}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              className="signup-button"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="signup-footer">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
