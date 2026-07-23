import "../styles/signUp.css";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Link } from "react-router";
import Logo from "../components/logo";
import { useAuth } from "../context/AuthContext";

function SignUp() {
  const [loading, setLoading] = useState(false);
  const { signup, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const formData = new FormData(e.target);
    const name = formData.get("name");
    const username = formData.get("username");
    const password = formData.get("password");
    const confirm = formData.get("confirm");
    if (!name || !username || !password || !confirm) return;

    setLoading(true);
    try {
      await signup({
        name,
        username,
        password,
        confirm,
        profilePictureUrl: "https://example.com/placeholder.png",
      });
      navigate("/signin");
    } catch {
      // error is set by AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-block">
        <Logo />
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="errors">
              <p>{error}</p>
            </div>
          )}
          <div className="form-row">
            <label htmlFor="name">Name: </label>
            <input type="text" id="name" name="name" required />
          </div>
          <div className="form-row">
            <label htmlFor="username">Username: </label>
            <input type="text" id="username" name="username" required />
          </div>
          <div className="form-row">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="confirm">Confirm Password:</label>
            <input
              type="password"
              id="confirm"
              name="confirm"
              required
            />
          </div>
          <div className="button-wrapper">
            <button type="submit" className={loading ? "inactive" : ""}>
              Sign Up
            </button>
            <p>
              Already have an account? <Link to="/signin">Sign In</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SignUp;
