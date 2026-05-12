import "../styles/signIn.css";
import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/logo";

function SignIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    //TODO: implement logic
  };

  return (
    <div className="signin-page">
      <div className="signin-block">
        <Logo />
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="errors">
              <p>Incorrect username or password</p>
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
              Don't have an account? <a href="/signup">Sign Up</a>{" "}
              {/* replace with <Link></Link> */}
            </p>
          </div>
        </form>
        <form onSubmit={handleSubmit}>
          <div className="line">
            <span>or</span>
          </div>
          <input type="text" name="username" value="guest" hidden />
          <input type="password" name="password" value="guestpassword" hidden />
          <button type="submit" className={loading ? "inactive" : ""}>
            Continue as Guest
          </button>
        </form>
      </div>
    </div>
  );
}

export default SignIn;
