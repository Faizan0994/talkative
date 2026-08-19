import { useState } from "react";
import { useNavigate } from "react-router";
import Logo from "../components/logo";
import { useAuth } from "../context/AuthContext";
import "../styles/settings.css";

function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || "You");
  const [username, setUsername] = useState(user?.username || "you");
  const [saved, setSaved] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    await logout();
    navigate("/signin");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/signin");
  };

  return (
    <div className="settings-page">
      <div className="settings-block">
        <div className="settings-header">
          <button
            className="settings-back"
            onClick={() => navigate("/dashboard")}
            aria-label="Back to dashboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </button>
          <Logo />
          <div className="settings-spacer" />
        </div>

        <h2 className="settings-title">Settings</h2>

        <form onSubmit={handleSave}>
          <div className="settings-avatar">{name[0].toUpperCase()}</div>
          <div className="form-row">
            <label htmlFor="settings-name">Name: </label>
            <input
              type="text"
              id="settings-name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="settings-username">Username: </label>
            <input
              type="text"
              id="settings-username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="button-wrapper">
            <button type="submit">{saved ? "Saved!" : "Save changes"}</button>
            <button type="button" className="settings-logout" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </form>

        <div className="settings-danger">
          <h3 className="settings-danger-title">Danger zone</h3>
          {confirmingDelete ? (
            <div className="settings-confirm">
              <p className="settings-confirm-text">
                This will permanently delete your account. Continue?
              </p>
              <div className="settings-confirm-actions">
                <button
                  className="settings-confirm-delete"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                >
                  Delete account
                </button>
                <button
                  className="settings-confirm-cancel"
                  onClick={() => setConfirmingDelete(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              className="settings-delete"
              onClick={() => setConfirmingDelete(true)}
            >
              Delete account
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;