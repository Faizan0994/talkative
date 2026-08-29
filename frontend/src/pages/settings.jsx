import { useState } from "react";
import { useNavigate } from "react-router";
import Logo from "../components/logo";
import { useAuth } from "../context/AuthContext";
import useApi from "../hooks/useApi";
import "../styles/settings.css";

function Settings() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const { loading, error, put, del, clearError } = useApi();

  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [profilePictureUrl, setProfilePictureUrl] = useState(
    user?.profilePictureUrl || "",
  );
  const [saved, setSaved] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleSave = async (e) => {
    e.preventDefault();
    clearError();
    setSaved(false);
    const res = await put("/api/users/", {
      name,
      username,
      profilePictureUrl,
    }).catch(() => null);
    if (!res?.user) return;
    updateUser(res.user);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError("");
    const err = await del("/api/users/").catch((e) => e);
    if (err) {
      setDeleting(false);
      setDeleteError(err.messages?.[0] || "Failed to delete account");
      return;
    }
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

        {error && (
          <div className="settings-error">
            {error.messages?.[0] || "Something went wrong"}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="settings-avatar">
            {profilePictureUrl ? (
              <img
                src={profilePictureUrl}
                alt={name}
                className="settings-avatar-img"
              />
            ) : (
              name[0]?.toUpperCase() || "Y"
            )}
          </div>
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
          <div className="form-row">
            <label htmlFor="settings-picture">Profile picture URL: </label>
            <input
              type="url"
              id="settings-picture"
              name="profilePictureUrl"
              value={profilePictureUrl}
              onChange={(e) => setProfilePictureUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
            />
          </div>
          <div className="button-wrapper">
            <button type="submit" disabled={loading}>
              {loading ? "Saving..." : saved ? "Saved!" : "Save changes"}
            </button>
            <button type="button" className="settings-logout" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </form>

        <div className="settings-danger">
          <h3 className="settings-danger-title">Danger zone</h3>
          {deleteError && (
            <div className="settings-error">{deleteError}</div>
          )}
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
                  {deleting ? "Deleting..." : "Delete account"}
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
