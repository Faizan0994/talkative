import { useState } from "react";
import "./userPicker.css";

function UserPicker({
  users,
  mode,
  selectedIds = [],
  onToggle,
  excludeIds = [],
  onSearch,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = onSearch
    ? users.filter((u) => !excludeIds.includes(u.id))
    : users.filter((u) => {
        if (excludeIds.includes(u.id)) return false;
        const q = searchQuery.toLowerCase();
        return (
          !q ||
          u.name.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q)
        );
      });

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (onSearch) onSearch(value);
  };

  return (
    <div className="user-picker">
      <div className="user-picker-search-wrapper">
        <svg
          className="user-picker-search-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
        <input
          type="text"
          placeholder="Search people"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>
      {filtered.length === 0 ? (
        <div className="user-picker-empty">No people found</div>
      ) : (
        <div className="user-picker-list">
          {filtered.map((user) => {
            const isSelected = selectedIds.includes(user.id);
            return (
              <div
                key={user.id}
                className={`user-picker-item ${
                  mode === "multi" && isSelected
                    ? "user-picker-item--selected"
                    : ""
                }`}
                onClick={() => onToggle(user.id)}
              >
                <div className="user-picker-avatar">
                  {user.profilePictureUrl ? (
                    <img
                      src={user.profilePictureUrl}
                      alt={user.name}
                      className="user-picker-avatar-img"
                    />
                  ) : (
                    user.name[0].toUpperCase()
                  )}
                </div>
                <div className="user-picker-item-body">
                  <div className="user-picker-item-name">{user.name}</div>
                  <div className="user-picker-item-username">
                    @{user.username}
                  </div>
                </div>
                {mode === "multi" && isSelected && (
                  <svg
                    className="user-picker-check"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default UserPicker;