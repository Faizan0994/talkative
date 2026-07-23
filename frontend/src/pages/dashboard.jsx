import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/signin");
  };

  if (!user) return null;

  return (
    <div>
      <h1>Talkative</h1>
      <p>Logged in as: {user.name}</p>
      <p>Username: {user.username}</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default Dashboard;
