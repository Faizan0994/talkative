import "../styles/welcome.css";
import Logo from "../components/logo";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
function WelcomeScreen() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let response;
    const baseUrl = import.meta.env.VITE_SERVER_URL;
    async function timeOut() {
      await new Promise((resolve) => {
        setTimeout(() => {
          console.log("Loading Timeout complete!");
          resolve();
        }, 2000);
      });
      response = await fetch(`${baseUrl}/health`);
      console.log(response);
      if (response.status === 200) {
        setLoading(false);
        navigate("/signin");
      }
    }
    timeOut();
  }, []);

  return (
    <>
      <div className="welcome-screen">
        <div className="welcome-block">
          <Logo className="logo" />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm8 12c0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8 8 3.582 8 8zm-19 0c0-6.065 4.935-11 11-11v2c-4.962 0-9 4.038-9 9 0 2.481 1.009 4.731 2.639 6.361l-1.414 1.414.015.014c-2-1.994-3.24-4.749-3.24-7.789z" />
          </svg>
        </div>
      </div>
    </>
  );
}

export default WelcomeScreen;
