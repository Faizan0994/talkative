import "../styles/signIn.css";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Link } from "react-router";
import Logo from "../components/logo";
import { useAuth } from "../context/AuthContext";

function SignIn() {
  const [loading, setLoading] = useState(false);
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const formData = new FormData(e.target);
    const username = formData.get("username");
    const password = formData.get("password");
    if (!username || !password) return;

    setLoading(true);
    try {
      await login(username, password);
      navigate("/dashboard");
    } catch {
      // error is set by AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-page">
      <div className="signin-block">
        <Logo />
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="errors">
              <p>{error}</p>
            </div>
          )}
          <div className="form-row">
            <label htmlFor="username">Username: </label>
            <input type="text" id="username-login" name="username" required />
          </div>
          <div className="form-row">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password-login"
              name="password"
              required
            />
          </div>
          <div className="button-wrapper">
            <button type="submit" className={loading ? "inactive" : ""}>
              Sign In
            </button>
            <p>
              Don't have an account? <Link to="/signup">Sign Up</Link>
            </p>
          </div>
        </form>
        <form onSubmit={handleSubmit}>
          <div className="line">
            <span>or</span>
          </div>
          <input type="text" name="username" value="guest" hidden readOnly />
          <input
            type="password"
            name="password"
            value="GuestPassword123"
            hidden
            readOnly
          />
          <button type="submit" className={loading ? "inactive" : ""}>
            Continue as Guest
          </button>
        </form>
      </div>
    </div>
  );
}

export default SignIn;
