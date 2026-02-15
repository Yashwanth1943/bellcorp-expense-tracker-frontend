import { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Auth.css";
import { Link } from "react-router-dom";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    setLoading(true);

    const { data } = await axios.post(
      "http://localhost:5000/api/auth/register",
      { name, email, password }
    );

    login(data);
    navigate("/dashboard");

  } catch (error) {
    alert("User already exists");
  } finally {
    setLoading(false);
  }
};


  return (
  <div className="auth-container">
    <div className="auth-card">
      <h2>Create Account</h2>

      <form onSubmit={handleSubmit}>
        <input
          className="auth-input"
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          className="auth-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className="auth-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className="auth-button" type="submit" disabled={loading}>
          {loading ? "Creating Account..." : "Register"}
        </button>

      </form>

      <div className="auth-link">
        Already have an account? <Link to="/login">Login</Link>
      </div>
    </div>
  </div>
);

}

export default Register;

