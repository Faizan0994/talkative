import { useState } from "react";
import Modal from "./modal";
import UserPicker from "./userPicker";
import "./newChatModal.css";

function NewChatForm({
  users,
  onSearchUsers,
  onStartChat,
  onCreateGroup,
  onClose,
}) {
  const [tab, setTab] = useState("chat");
  const [groupUserIds, setGroupUserIds] = useState([]);
  const [groupName, setGroupName] = useState("");

  const handleSelectChatUser = (id) => {
    onStartChat(id);
    onClose();
  };

  const handleToggleGroupUser = (id) => {
    setGroupUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleCreateGroup = () => {
    if (groupName.trim().length < 3 || groupUserIds.length < 2) return;
    onCreateGroup(groupName.trim(), groupUserIds);
    onClose();
  };

  const canSubmit =
    groupName.trim().length >= 3 && groupUserIds.length >= 2;

  return (
    <div className="new-chat">
      <div className="new-chat-tabs">
        <button
          className={`new-chat-tab ${
            tab === "chat" ? "new-chat-tab--active" : ""
          }`}
          onClick={() => setTab("chat")}
        >
          New chat
        </button>
        <button
          className={`new-chat-tab ${
            tab === "group" ? "new-chat-tab--active" : ""
          }`}
          onClick={() => setTab("group")}
        >
          New group
        </button>
      </div>

      {tab === "group" && (
        <input
          className="new-chat-group-name"
          type="text"
          placeholder="Group name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />
      )}

      <UserPicker
        users={users}
        mode={tab === "chat" ? "single" : "multi"}
        selectedIds={tab === "chat" ? [] : groupUserIds}
        onToggle={tab === "chat" ? handleSelectChatUser : handleToggleGroupUser}
        onSearch={onSearchUsers}
      />

      {tab === "group" && (
        <button
          className="new-chat-submit"
          onClick={handleCreateGroup}
          disabled={!canSubmit}
        >
          Create group
        </button>
      )}
    </div>
  );
}

function NewChatModal({
  open,
  onClose,
  users,
  onSearchUsers,
  onStartChat,
  onCreateGroup,
}) {
  return (
    <Modal open={open} onClose={onClose} title="New chat">
      {open && (
        <NewChatForm
          users={users}
          onSearchUsers={onSearchUsers}
          onStartChat={onStartChat}
          onCreateGroup={onCreateGroup}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}

export default NewChatModal;