import { useState } from "react";
import Modal from "./modal";
import UserPicker from "./userPicker";
import "./chatInfoModal.css";

function ChatInfoForm({
  chat,
  users,
  onSearchUsers,
  currentUserId,
  onRenameChat,
  onAddParticipants,
  onClose,
  onLeaveChat,
}) {
  const [name, setName] = useState(chat.name || "");
  const [adding, setAdding] = useState(false);
  const [newMemberIds, setNewMemberIds] = useState([]);

  const memberIds = (chat.participants || []).map((p) => p.id);
  const otherParticipant = (chat.participants || []).find(
    (p) => p.id !== currentUserId,
  );
  const canSaveName = name.trim().length >= 3;

  const handleSaveName = () => {
    if (!canSaveName) return;
    onRenameChat(name.trim());
    onClose();
  };

  const handleAdd = () => {
    if (newMemberIds.length === 0) return;
    onAddParticipants(newMemberIds);
    setAdding(false);
    setNewMemberIds([]);
  };

  return (
    <div className="chat-info">
      {chat.isGroup ? (
        <>
          <div className="chat-info-section">
            <div className="chat-info-label">Group name</div>
            <div className="chat-info-rename-row">
              <input
                className="chat-info-rename"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button
                className="chat-info-save"
                onClick={handleSaveName}
                disabled={!canSaveName}
              >
                Save
              </button>
            </div>
          </div>

          <div className="chat-info-section">
            <div className="chat-info-label">
              Members ({memberIds.length})
            </div>
            <div className="chat-info-members">
              {(chat.participants || []).map((p) => (
                <div className="chat-info-member" key={p.id}>
                  <div className="chat-info-member-avatar">
                    {p.id === currentUserId ? "Y" : p.name[0].toUpperCase()}
                  </div>
                  <div className="chat-info-member-name">
                    {p.id === currentUserId ? "You" : p.name}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="chat-info-section">
            {adding ? (
              <div className="chat-info-add">
                <UserPicker
                  users={users}
                  mode="multi"
                  selectedIds={newMemberIds}
                  onToggle={(id) =>
                    setNewMemberIds((prev) =>
                      prev.includes(id)
                        ? prev.filter((x) => x !== id)
                        : [...prev, id],
                    )
                  }
                  excludeIds={memberIds}
                  onSearch={onSearchUsers}
                />
                <button
                  className="chat-info-add-btn"
                  onClick={handleAdd}
                  disabled={newMemberIds.length === 0}
                >
                  Add members
                </button>
              </div>
            ) : (
              <button
                className="chat-info-add-members"
                onClick={() => setAdding(true)}
              >
                Add members
              </button>
            )}
          </div>

          <div className="chat-info-section">
            <button className="chat-info-leave" onClick={onLeaveChat}>
              Leave chat
            </button>
          </div>
        </>
      ) : (
        <div className="chat-info-section">
          <div className="chat-info-label">Direct chat with</div>
          <div className="chat-info-single">
            @{otherParticipant?.username}
          </div>
        </div>
      )}
    </div>
  );
}

function ChatInfoModal({
  open,
  onClose,
  chat,
  users,
  onSearchUsers,
  currentUserId,
  onRenameChat,
  onAddParticipants,
  onLeaveChat,
}) {
  return (
    <Modal open={open} onClose={onClose} title="Chat info">
      {open && chat && (
        <ChatInfoForm
          chat={chat}
          users={users}
          onSearchUsers={onSearchUsers}
          currentUserId={currentUserId}
          onRenameChat={onRenameChat}
          onAddParticipants={onAddParticipants}
          onClose={onClose}
          onLeaveChat={onLeaveChat}
        />
      )}
    </Modal>
  );
}

export default ChatInfoModal;